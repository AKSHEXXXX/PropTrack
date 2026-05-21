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
