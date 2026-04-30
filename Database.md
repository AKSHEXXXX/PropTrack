# DATABASE.md — PropTrack CRM
## Complete Database Reference

---

## 1. Schema Creation (CREATE TABLE Statements)

Run this first. Order matters due to foreign key dependencies.

```sql
-- ============================================================
-- 0. ENUMS
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

-- ============================================================
-- 1. AGENCIES
-- ============================================================
CREATE TABLE agencies (
    agency_id   SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    address     VARCHAR(500),
    phone       VARCHAR(20),
    email       VARCHAR(255) NOT NULL UNIQUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. AGENTS
-- ============================================================
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

-- ============================================================
-- 3. CLIENTS
-- ============================================================
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

-- ============================================================
-- 4. PROPERTIES
-- ============================================================
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

-- ============================================================
-- 5. PROPERTY IMAGES
-- ============================================================
CREATE TABLE property_images (
    image_id    SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    image_url   VARCHAR(1000) NOT NULL,
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one primary image per property
CREATE UNIQUE INDEX idx_one_primary_image
    ON property_images(property_id)
    WHERE is_primary = TRUE;

-- ============================================================
-- 6. LEADS
-- ============================================================
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
    -- Business rule: no duplicate active leads for same client + property
    CONSTRAINT uq_active_lead UNIQUE (client_id, property_id)
);

-- ============================================================
-- 7. APPOINTMENTS
-- ============================================================
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

-- ============================================================
-- 8. DEALS
-- ============================================================
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

-- ============================================================
-- 9. DEAL AUDIT LOG (required for trigger TRG-03)
-- ============================================================
CREATE TABLE deal_audit_log (
    log_id      SERIAL PRIMARY KEY,
    deal_id     INTEGER NOT NULL,
    old_status  deal_status_enum,
    new_status  deal_status_enum NOT NULL,
    changed_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by  VARCHAR(255)
);

-- ============================================================
-- 10. CONTRACTS
-- ============================================================
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

-- ============================================================
-- 11. PAYMENTS
-- ============================================================
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

-- ============================================================
-- 12. TAGS
-- ============================================================
CREATE TABLE tags (
    tag_id  SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE,
    color   VARCHAR(7) NOT NULL DEFAULT '#6B7280'
);

-- ============================================================
-- 13. LEAD_TAGS (junction table)
-- ============================================================
CREATE TABLE lead_tags (
    lead_id INTEGER NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, tag_id)
);

-- ============================================================
-- INDEXES (performance optimization)
-- ============================================================
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
```

---

## 2. SQL Functions

### FN-01: fn_calculate_commission
> Returns the commission amount for a given deal based on final price and agent commission rate.

```sql
CREATE OR REPLACE FUNCTION fn_calculate_commission(p_deal_id INTEGER)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_final_price       DECIMAL(15,2);
    v_commission_rate   DECIMAL(5,4);
    v_commission        DECIMAL(15,2);
BEGIN
    SELECT
        d.final_price,
        a.commission_rate
    INTO
        v_final_price,
        v_commission_rate
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

-- Usage:
-- SELECT fn_calculate_commission(1);
```

### FN-02: fn_get_agent_conversion_rate
> Returns the lead-to-deal conversion rate (%) for a given agent.

```sql
CREATE OR REPLACE FUNCTION fn_get_agent_conversion_rate(p_agent_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_leads   INTEGER;
    v_closed_deals  INTEGER;
    v_rate          DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO v_total_leads
    FROM leads
    WHERE agent_id = p_agent_id;

    SELECT COUNT(*) INTO v_closed_deals
    FROM leads
    WHERE agent_id = p_agent_id
      AND status = 'deal_closed';

    IF v_total_leads = 0 THEN
        RETURN 0.00;
    END IF;

    v_rate := ROUND((v_closed_deals::DECIMAL / v_total_leads) * 100, 2);
    RETURN v_rate;
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT fn_get_agent_conversion_rate(2);
```

---

## 3. Triggers

### TRG-01: trg_close_deal_update_property
> When a deal status becomes 'closed', automatically updates the linked property status to 'sold'.

```sql
CREATE OR REPLACE FUNCTION trg_fn_close_deal_update_property()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        UPDATE properties
        SET status = 'sold',
            updated_at = NOW()
        WHERE property_id = NEW.property_id;

        -- Also update lead status
        UPDATE leads
        SET status = 'deal_closed',
            updated_at = NOW()
        WHERE lead_id = NEW.lead_id;

        RAISE NOTICE 'Deal % closed: Property % marked as sold', NEW.deal_id, NEW.property_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_close_deal_update_property
AFTER UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION trg_fn_close_deal_update_property();
```

### TRG-02: trg_flag_stale_leads
> When a lead is updated, checks if last_activity is > 7 days ago and flags it as stale.

```sql
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
FOR EACH ROW
EXECUTE FUNCTION trg_fn_flag_stale_leads();
```

### TRG-03: trg_audit_log_deals
> On any insert or update to deals, writes a record to deal_audit_log for a full audit trail.

```sql
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
FOR EACH ROW
EXECUTE FUNCTION trg_fn_audit_log_deals();
```

---

## 4. Stored Procedures

### PRC-01: sp_auto_assign_lead
> Assigns a lead to the agent within the agency who currently has the fewest active leads.

```sql
CREATE OR REPLACE PROCEDURE sp_auto_assign_lead(
    p_lead_id   INTEGER,
    p_agency_id INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    v_agent_id  INTEGER;
BEGIN
    -- Find agent in the agency with fewest active leads
    SELECT a.agent_id INTO v_agent_id
    FROM agents a
    LEFT JOIN leads l ON l.agent_id = a.agent_id
        AND l.status NOT IN ('deal_closed', 'lost')
    WHERE a.agency_id = p_agency_id
      AND a.is_active = TRUE
    GROUP BY a.agent_id
    ORDER BY COUNT(l.lead_id) ASC
    LIMIT 1;

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'No active agents found for agency %', p_agency_id;
    END IF;

    -- Assign the lead
    UPDATE leads
    SET agent_id = v_agent_id,
        updated_at = NOW()
    WHERE lead_id = p_lead_id;

    RAISE NOTICE 'Lead % assigned to agent %', p_lead_id, v_agent_id;
END;
$$;

-- Usage:
-- CALL sp_auto_assign_lead(5, 1);
```

### PRC-02: sp_generate_monthly_report
> Generates a performance report for all agents in an agency for a given month/year.

```sql
CREATE OR REPLACE PROCEDURE sp_generate_monthly_report(
    p_agency_id INTEGER,
    p_month     INTEGER,
    p_year      INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    v_rec RECORD;
BEGIN
    RAISE NOTICE '=== Monthly Report: Agency % | %/% ===', p_agency_id, p_month, p_year;
    RAISE NOTICE '%-20s %-12s %-12s %-15s %-12s',
        'Agent', 'Leads', 'Deals Closed', 'Revenue', 'Commission';
    RAISE NOTICE '%', REPEAT('-', 75);

    FOR v_rec IN
        SELECT
            a.first_name || ' ' || a.last_name               AS agent_name,
            COUNT(DISTINCT l.lead_id)                         AS total_leads,
            COUNT(DISTINCT d.deal_id)                         AS deals_closed,
            COALESCE(SUM(d.final_price), 0)                   AS total_revenue,
            COALESCE(SUM(d.commission_amount), 0)             AS total_commission,
            fn_get_agent_conversion_rate(a.agent_id)          AS conversion_rate
        FROM agents a
        LEFT JOIN leads l
            ON l.agent_id = a.agent_id
           AND EXTRACT(MONTH FROM l.created_at) = p_month
           AND EXTRACT(YEAR  FROM l.created_at) = p_year
        LEFT JOIN deals d
            ON d.agent_id = a.agent_id
           AND d.status = 'closed'
           AND EXTRACT(MONTH FROM d.closing_date) = p_month
           AND EXTRACT(YEAR  FROM d.closing_date) = p_year
        WHERE a.agency_id = p_agency_id
          AND a.is_active = TRUE
        GROUP BY a.agent_id, a.first_name, a.last_name
        ORDER BY deals_closed DESC, total_revenue DESC
    LOOP
        RAISE NOTICE '%-20s %-12s %-12s %-15s %-12s',
            v_rec.agent_name,
            v_rec.total_leads,
            v_rec.deals_closed,
            v_rec.total_revenue,
            v_rec.total_commission;
    END LOOP;
END;
$$;

-- Usage:
-- CALL sp_generate_monthly_report(1, 8, 2025);
```

---

## 5. Nested Queries

### NQ-01: Agents with no closed deals this month
> Used in dashboard to identify underperforming agents.

```sql
SELECT
    a.agent_id,
    a.first_name || ' ' || a.last_name AS agent_name,
    a.email,
    COUNT(l.lead_id) AS active_leads
FROM agents a
LEFT JOIN leads l ON l.agent_id = a.agent_id
    AND l.status NOT IN ('deal_closed', 'lost')
WHERE a.is_active = TRUE
  AND a.agent_id NOT IN (
      SELECT DISTINCT d.agent_id
      FROM deals d
      WHERE d.status = 'closed'
        AND EXTRACT(MONTH FROM d.closing_date) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(YEAR  FROM d.closing_date) = EXTRACT(YEAR  FROM NOW())
  )
GROUP BY a.agent_id, a.first_name, a.last_name, a.email
ORDER BY active_leads DESC;
```

### NQ-02: Top 5 agents by total deal value this month
> Used in dashboard leaderboard.

```sql
SELECT
    a.agent_id,
    a.first_name || ' ' || a.last_name AS agent_name,
    COUNT(d.deal_id)           AS deals_closed,
    SUM(d.final_price)         AS total_deal_value,
    SUM(d.commission_amount)   AS total_commission,
    fn_get_agent_conversion_rate(a.agent_id) AS conversion_rate_pct
FROM agents a
JOIN deals d ON d.agent_id = a.agent_id
WHERE d.status = 'closed'
  AND d.closing_date >= DATE_TRUNC('month', NOW())
  AND d.closing_date <  DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
GROUP BY a.agent_id, a.first_name, a.last_name
HAVING SUM(d.final_price) > (
    SELECT AVG(monthly_total)
    FROM (
        SELECT SUM(final_price) AS monthly_total
        FROM deals
        WHERE status = 'closed'
          AND closing_date >= DATE_TRUNC('month', NOW())
        GROUP BY agent_id
    ) AS agent_totals
)
ORDER BY total_deal_value DESC
LIMIT 5;
```

### NQ-03: Properties priced above agency average
> Used in property analytics section.

```sql
SELECT
    p.property_id,
    p.title,
    p.city,
    p.price,
    p.property_type,
    p.status,
    a.first_name || ' ' || a.last_name AS agent_name
FROM properties p
JOIN agents a ON a.agent_id = p.agent_id
WHERE p.price > (
    SELECT AVG(price)
    FROM properties
    WHERE status != 'off_market'
)
  AND p.status = 'available'
ORDER BY p.price DESC;
```

---

## 6. Correlated Queries

### CQ-01: Properties visited but never offered on
> Finds properties that had appointments but no deal was ever created. Useful for identifying under-performing listings.

```sql
SELECT
    p.property_id,
    p.title,
    p.city,
    p.price,
    p.property_type,
    COUNT(apt.appointment_id) AS total_visits,
    MAX(apt.scheduled_at)     AS last_visit_date,
    a.first_name || ' ' || a.last_name AS agent_name
FROM properties p
JOIN appointments apt ON apt.property_id = p.property_id
JOIN agents a ON a.agent_id = p.agent_id
WHERE p.status = 'available'
  AND NOT EXISTS (
      SELECT 1
      FROM deals d
      WHERE d.property_id = p.property_id
        AND d.status IN ('pending', 'active', 'closed')
  )
GROUP BY p.property_id, p.title, p.city, p.price, p.property_type,
         a.first_name, a.last_name
HAVING COUNT(apt.appointment_id) >= 2
ORDER BY total_visits DESC, last_visit_date DESC;
```

### CQ-02: Stale leads with their agent's full pipeline context
> For each stale lead, shows the agent's total workload to help managers redistribute.

```sql
SELECT
    l.lead_id,
    c.first_name || ' ' || c.last_name  AS client_name,
    p.title                              AS property_title,
    l.status                             AS lead_status,
    l.last_activity,
    NOW() - l.last_activity              AS inactive_for,
    a.first_name || ' ' || a.last_name  AS agent_name,
    (
        SELECT COUNT(*)
        FROM leads l2
        WHERE l2.agent_id = l.agent_id
          AND l2.status NOT IN ('deal_closed', 'lost')
    ) AS agent_total_active_leads,
    (
        SELECT COUNT(*)
        FROM leads l3
        WHERE l3.agent_id = l.agent_id
          AND l3.status NOT IN ('deal_closed', 'lost')
          AND l3.is_stale = TRUE
    ) AS agent_stale_lead_count
FROM leads l
JOIN clients c   ON c.client_id   = l.client_id
JOIN properties p ON p.property_id = l.property_id
JOIN agents a    ON a.agent_id    = l.agent_id
WHERE l.is_stale = TRUE
  AND l.status NOT IN ('deal_closed', 'lost')
ORDER BY l.last_activity ASC;
```

---

## 7. Normalization Summary (for Assignment Report)

### 1NF (First Normal Form)
All tables satisfy 1NF:
- Every column holds atomic values (no arrays, no comma-separated lists)
- Every row is uniquely identified by a primary key
- The `lead_tags` junction table handles the many-to-many relationship atomically

### 2NF (Second Normal Form)
All tables satisfy 2NF:
- All non-key attributes are fully dependent on the entire primary key
- No partial dependencies exist (all keys are single-column surrogates)
- Example: `property_images` stores only `image_url` and `is_primary`, both depend on `image_id` alone

### 3NF (Third Normal Form)
All tables satisfy 3NF:
- No transitive dependencies
- Example: `commission_amount` in `deals` could be derived from `final_price * agent.commission_rate`, but is stored to preserve historical accuracy at time of deal (rate may change later). This is a justified denormalization.
- Example: Agent's `agency_id` is stored in `agents` table only. `leads` and `deals` do not redundantly store `agency_id` — they join through `agent_id`

---

## 8. Apply Everything

```bash
# Apply schema (run once)
docker exec -i proptrack_db psql -U proptrack -d proptrack_db < src/database/sql/schema.sql

# Apply advanced SQL (functions, triggers, procedures)
docker exec -i proptrack_db psql -U proptrack -d proptrack_db < src/database/sql/advanced.sql

# Verify triggers
docker exec proptrack_db psql -U proptrack -d proptrack_db \
  -c "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';"

# Verify functions and procedures
docker exec proptrack_db psql -U proptrack -d proptrack_db \
  -c "SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public';"

# Test a function
docker exec proptrack_db psql -U proptrack -d proptrack_db \
  -c "SELECT fn_calculate_commission(1);"

# Test a procedure
docker exec proptrack_db psql -U proptrack -d proptrack_db \
  -c "CALL sp_auto_assign_lead(1, 1);"
```
