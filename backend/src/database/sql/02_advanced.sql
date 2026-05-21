-- ============================================================
-- PropTrack CRM — Advanced SQL
-- Functions, Triggers, Stored Procedures
-- ============================================================

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- FN-01: Calculate commission for a deal
CREATE OR REPLACE FUNCTION fn_calculate_commission(p_deal_id INTEGER)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_final_price       DECIMAL(15,2);
    v_commission_rate   DECIMAL(5,4);
    v_commission        DECIMAL(15,2);
BEGIN
    SELECT d.final_price, a.commission_rate
    INTO v_final_price, v_commission_rate
    FROM deals d
    JOIN agents a ON a.agent_id = d.agent_id
    WHERE d.deal_id = p_deal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal with ID % not found', p_deal_id;
    END IF;

    v_commission := ROUND(v_final_price * v_commission_rate, 2);
    RETURN v_commission;
END;
$$ LANGUAGE plpgsql;

-- FN-02: Agent lead-to-deal conversion rate
CREATE OR REPLACE FUNCTION fn_get_agent_conversion_rate(p_agent_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_leads   INTEGER;
    v_closed_deals  INTEGER;
    v_rate          DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO v_total_leads FROM leads WHERE agent_id = p_agent_id;
    SELECT COUNT(*) INTO v_closed_deals FROM leads WHERE agent_id = p_agent_id AND status = 'deal_closed';

    IF v_total_leads = 0 THEN RETURN 0.00; END IF;
    v_rate := ROUND((v_closed_deals::DECIMAL / v_total_leads) * 100, 2);
    RETURN v_rate;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- TRG-01: Close deal → property becomes sold
CREATE OR REPLACE FUNCTION trg_fn_close_deal_update_property()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        UPDATE properties SET status = 'sold', updated_at = NOW() WHERE property_id = NEW.property_id;
        UPDATE leads SET status = 'deal_closed', updated_at = NOW() WHERE lead_id = NEW.lead_id;
        RAISE NOTICE 'Deal % closed: Property % marked as sold', NEW.deal_id, NEW.property_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_close_deal_update_property
AFTER UPDATE ON deals
FOR EACH ROW EXECUTE FUNCTION trg_fn_close_deal_update_property();

-- TRG-02: Flag stale leads (no activity > 7 days)
CREATE OR REPLACE FUNCTION trg_fn_flag_stale_leads()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_activity < (NOW() - INTERVAL '7 days')
       AND NEW.status NOT IN ('deal_closed', 'lost') THEN
        NEW.is_stale := TRUE;
    ELSE
        NEW.is_stale := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_flag_stale_leads
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION trg_fn_flag_stale_leads();

-- TRG-03: Audit log on deal insert/update
CREATE OR REPLACE FUNCTION trg_fn_audit_log_deals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO deal_audit_log(deal_id, old_status, new_status)
        VALUES (NEW.deal_id, NULL, NEW.status);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO deal_audit_log(deal_id, old_status, new_status)
            VALUES (NEW.deal_id, OLD.status, NEW.status);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_deals
AFTER INSERT OR UPDATE ON deals
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_log_deals();

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- PRC-01: Auto-assign lead to agent with fewest active leads
CREATE OR REPLACE PROCEDURE sp_auto_assign_lead(p_lead_id INTEGER, p_agency_id INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
    v_agent_id INTEGER;
BEGIN
    SELECT a.agent_id INTO v_agent_id
    FROM agents a
    LEFT JOIN leads l ON l.agent_id = a.agent_id AND l.status NOT IN ('deal_closed','lost')
    WHERE a.agency_id = p_agency_id AND a.is_active = TRUE
    GROUP BY a.agent_id
    ORDER BY COUNT(l.lead_id) ASC
    LIMIT 1;

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'No active agents found for agency %', p_agency_id;
    END IF;

    UPDATE leads SET agent_id = v_agent_id, updated_at = NOW() WHERE lead_id = p_lead_id;
    RAISE NOTICE 'Lead % assigned to agent %', p_lead_id, v_agent_id;
END;
$$;

-- PRC-02: Monthly performance report
CREATE OR REPLACE PROCEDURE sp_generate_monthly_report(p_agency_id INTEGER, p_month INTEGER, p_year INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
    v_rec RECORD;
BEGIN
    RAISE NOTICE '=== Monthly Report: Agency % | %/% ===', p_agency_id, p_month, p_year;
    RAISE NOTICE '%-20s %-12s %-12s %-15s %-12s', 'Agent','Leads','Deals Closed','Revenue','Commission';
    RAISE NOTICE '%', REPEAT('-', 75);

    FOR v_rec IN
        SELECT
            a.first_name || ' ' || a.last_name AS agent_name,
            COUNT(DISTINCT l.lead_id) AS total_leads,
            COUNT(DISTINCT d.deal_id) AS deals_closed,
            COALESCE(SUM(d.final_price), 0) AS total_revenue,
            COALESCE(SUM(d.commission_amount), 0) AS total_commission,
            fn_get_agent_conversion_rate(a.agent_id) AS conversion_rate
        FROM agents a
        LEFT JOIN leads l ON l.agent_id = a.agent_id
            AND EXTRACT(MONTH FROM l.created_at) = p_month
            AND EXTRACT(YEAR  FROM l.created_at) = p_year
        LEFT JOIN deals d ON d.agent_id = a.agent_id AND d.status = 'closed'
            AND EXTRACT(MONTH FROM d.closing_date) = p_month
            AND EXTRACT(YEAR  FROM d.closing_date) = p_year
        WHERE a.agency_id = p_agency_id AND a.is_active = TRUE
        GROUP BY a.agent_id, a.first_name, a.last_name
        ORDER BY deals_closed DESC, total_revenue DESC
    LOOP
        RAISE NOTICE '%-20s %-12s %-12s %-15s %-12s',
            v_rec.agent_name, v_rec.total_leads, v_rec.deals_closed,
            v_rec.total_revenue, v_rec.total_commission;
    END LOOP;
END;
$$;

-- ============================================================
-- NESTED QUERIES (documented, used in dashboard endpoints)
-- ============================================================

-- NQ-01: Agents with no closed deals this month
-- (See dashboard/agent-performance endpoint)

-- NQ-02: Top 5 agents by total deal value this month
-- (See dashboard/top-agents endpoint)

-- NQ-03: Properties priced above agency average
-- (See dashboard/above-average endpoint)

-- ============================================================
-- CORRELATED QUERIES (used in dashboard endpoints)
-- ============================================================

-- CQ-01: Properties visited but never offered on
-- (See dashboard/unsold-viewed endpoint)

-- CQ-02: Stale leads with agent pipeline context
-- (See dashboard/stale-leads endpoint)
