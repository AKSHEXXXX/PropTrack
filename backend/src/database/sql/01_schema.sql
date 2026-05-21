-- ============================================================
-- PropTrack CRM — Schema
-- ============================================================

CREATE TYPE property_type_enum    AS ENUM ('apartment','villa','townhouse','office','retail','land');
CREATE TYPE property_status_enum  AS ENUM ('available','under_negotiation','sold','rented','off_market');
CREATE TYPE client_type_enum      AS ENUM ('buyer','seller','renter','landlord');
CREATE TYPE lead_status_enum      AS ENUM ('new','contacted','visit_scheduled','offer_made','deal_closed','lost');
CREATE TYPE appt_type_enum        AS ENUM ('site_visit','meeting','call');
CREATE TYPE appt_status_enum      AS ENUM ('scheduled','completed','cancelled','no_show');
CREATE TYPE deal_status_enum      AS ENUM ('pending','active','closed','cancelled');
CREATE TYPE contract_type_enum    AS ENUM ('sale','rental','mou','listing_agreement');
CREATE TYPE contract_status_enum  AS ENUM ('draft','sent','signed','expired','cancelled');
CREATE TYPE payment_type_enum     AS ENUM ('full','installment','deposit','commission');
CREATE TYPE payment_status_enum   AS ENUM ('pending','completed','failed','refunded');

CREATE TABLE agencies (
    agency_id   SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    address     VARCHAR(500),
    phone       VARCHAR(20),
    email       VARCHAR(255) NOT NULL UNIQUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE agents (
    agent_id        SERIAL PRIMARY KEY,
    agency_id       INTEGER NOT NULL REFERENCES agencies(agency_id) ON DELETE RESTRICT,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.025
                    CHECK (commission_rate BETWEEN 0 AND 1),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at       DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'agent',
    agent_id    INTEGER,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE clients (
    client_id   SERIAL PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE,
    phone       VARCHAR(20),
    client_type client_type_enum NOT NULL DEFAULT 'buyer',
    nationality VARCHAR(100),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE properties (
    property_id     SERIAL PRIMARY KEY,
    agent_id        INTEGER NOT NULL REFERENCES agents(agent_id) ON DELETE RESTRICT,
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    location        VARCHAR(500) NOT NULL,
    city            VARCHAR(100) NOT NULL DEFAULT 'Dubai',
    price           DECIMAL(15,2) NOT NULL CHECK (price > 0),
    area_sqft       DECIMAL(10,2) CHECK (area_sqft > 0),
    property_type   property_type_enum NOT NULL,
    status          property_status_enum NOT NULL DEFAULT 'available',
    bedrooms        SMALLINT CHECK (bedrooms >= 0),
    bathrooms       SMALLINT CHECK (bathrooms >= 0),
    listed_at       DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE property_images (
    image_id    SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    image_url   VARCHAR(1000) NOT NULL,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_one_primary_image ON property_images(property_id) WHERE is_primary = TRUE;

CREATE TABLE leads (
    lead_id         SERIAL PRIMARY KEY,
    client_id       INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT,
    property_id     INTEGER NOT NULL REFERENCES properties(property_id) ON DELETE RESTRICT,
    agent_id        INTEGER NOT NULL REFERENCES agents(agent_id) ON DELETE RESTRICT,
    status          lead_status_enum NOT NULL DEFAULT 'new',
    notes           TEXT,
    budget          DECIMAL(15,2) CHECK (budget > 0),
    is_stale        BOOLEAN NOT NULL DEFAULT FALSE,
    inquiry_date    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_active_lead UNIQUE (client_id, property_id)
);

CREATE TABLE appointments (
    appointment_id  SERIAL PRIMARY KEY,
    lead_id         INTEGER NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    agent_id        INTEGER NOT NULL REFERENCES agents(agent_id) ON DELETE RESTRICT,
    client_id       INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT,
    property_id     INTEGER NOT NULL REFERENCES properties(property_id) ON DELETE RESTRICT,
    scheduled_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    type            appt_type_enum NOT NULL DEFAULT 'site_visit',
    status          appt_status_enum NOT NULL DEFAULT 'scheduled',
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deals (
    deal_id           SERIAL PRIMARY KEY,
    lead_id           INTEGER NOT NULL REFERENCES leads(lead_id) ON DELETE RESTRICT,
    property_id       INTEGER NOT NULL REFERENCES properties(property_id) ON DELETE RESTRICT,
    agent_id          INTEGER NOT NULL REFERENCES agents(agent_id) ON DELETE RESTRICT,
    client_id         INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT,
    final_price       DECIMAL(15,2) NOT NULL CHECK (final_price > 0),
    commission_amount DECIMAL(15,2),
    status            deal_status_enum NOT NULL DEFAULT 'pending',
    deal_date         DATE DEFAULT CURRENT_DATE,
    closing_date      DATE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deal_audit_log (
    log_id      SERIAL PRIMARY KEY,
    deal_id     INTEGER NOT NULL,
    old_status  deal_status_enum,
    new_status  deal_status_enum NOT NULL,
    changed_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by  VARCHAR(255)
);

CREATE TABLE contracts (
    contract_id     SERIAL PRIMARY KEY,
    deal_id         INTEGER NOT NULL REFERENCES deals(deal_id) ON DELETE CASCADE,
    document_url    VARCHAR(1000),
    contract_type   contract_type_enum NOT NULL,
    signed_date     DATE,
    expiry_date     DATE,
    status          contract_status_enum NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    payment_id    SERIAL PRIMARY KEY,
    deal_id       INTEGER NOT NULL REFERENCES deals(deal_id) ON DELETE RESTRICT,
    amount        DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_type  payment_type_enum NOT NULL,
    status        payment_status_enum NOT NULL DEFAULT 'pending',
    payment_date  DATE DEFAULT CURRENT_DATE,
    reference_no  VARCHAR(100) UNIQUE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tags (
    tag_id  SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE,
    color   VARCHAR(7) NOT NULL DEFAULT '#6B7280'
);

CREATE TABLE lead_tags (
    lead_id INTEGER NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, tag_id)
);

-- Indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city   ON properties(city);
CREATE INDEX idx_properties_type   ON properties(property_type);
CREATE INDEX idx_leads_status      ON leads(status);
CREATE INDEX idx_leads_agent_id    ON leads(agent_id);
CREATE INDEX idx_leads_last_activity ON leads(last_activity);
CREATE INDEX idx_deals_status      ON deals(status);
CREATE INDEX idx_deals_agent_id    ON deals(agent_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_agent_id     ON appointments(agent_id);

-- ============================================================
-- PropTrack CRM — Advanced SQL
-- Functions, Triggers, Stored Procedures
-- ============================================================

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
