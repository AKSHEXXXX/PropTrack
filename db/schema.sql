-- PropTrack CRM Database Schema
-- PostgreSQL v16+

-- ============================================
-- CREATE ENUMS
-- ============================================

CREATE TYPE client_type AS ENUM ('buyer', 'seller', 'renter', 'landlord');
CREATE TYPE property_type AS ENUM ('apartment', 'villa', 'townhouse', 'office', 'retail', 'land');
CREATE TYPE property_status AS ENUM ('available', 'under_negotiation', 'sold', 'rented', 'off_market');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'visit_scheduled', 'offer_made', 'deal_closed', 'lost');
CREATE TYPE appointment_type AS ENUM ('site_visit', 'meeting', 'call');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE deal_status AS ENUM ('pending', 'active', 'closed', 'cancelled');
CREATE TYPE contract_type AS ENUM ('sale', 'rental', 'mou', 'listing_agreement');
CREATE TYPE contract_status AS ENUM ('draft', 'sent', 'signed', 'expired', 'cancelled');
CREATE TYPE payment_type AS ENUM ('full', 'installment', 'deposit', 'commission');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) DEFAULT 'agent',
  agentId INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AGENCIES TABLE
-- ============================================

CREATE TABLE agencies (
  agency_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  phone VARCHAR(20),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AGENTS TABLE
-- ============================================

CREATE TABLE agents (
  agent_id SERIAL PRIMARY KEY,
  agency_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  commission_rate DECIMAL(5,4) DEFAULT 0.025,
  is_active BOOLEAN DEFAULT true,
  joined_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(agency_id)
);

-- ============================================
-- CLIENTS TABLE
-- ============================================

CREATE TABLE clients (
  client_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  client_type client_type DEFAULT 'buyer',
  nationality VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PROPERTIES TABLE
-- ============================================

CREATE TABLE properties (
  property_id SERIAL PRIMARY KEY,
  agent_id INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  location VARCHAR(500) NOT NULL,
  city VARCHAR(100) DEFAULT 'Dubai',
  price DECIMAL(15,2) NOT NULL,
  area_sqft DECIMAL(10,2),
  property_type property_type NOT NULL,
  status property_status DEFAULT 'available',
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  listed_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- ============================================
-- PROPERTY IMAGES TABLE
-- ============================================

CREATE TABLE property_images (
  image_id SERIAL PRIMARY KEY,
  property_id INT NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

-- ============================================
-- TAGS TABLE
-- ============================================

CREATE TABLE tags (
  tag_id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280'
);

-- ============================================
-- LEADS TABLE
-- ============================================

CREATE TABLE leads (
  lead_id SERIAL PRIMARY KEY,
  client_id INT NOT NULL,
  property_id INT NOT NULL,
  agent_id INT NOT NULL,
  status lead_status DEFAULT 'new',
  notes TEXT,
  budget DECIMAL(15,2),
  is_stale BOOLEAN DEFAULT false,
  inquiry_date TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(client_id),
  FOREIGN KEY (property_id) REFERENCES properties(property_id),
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- ============================================
-- LEAD TAGS JUNCTION TABLE (Many-to-Many)
-- ============================================

CREATE TABLE lead_tags (
  lead_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (lead_id, tag_id),
  FOREIGN KEY (lead_id) REFERENCES leads(lead_id),
  FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

CREATE TABLE appointments (
  appointment_id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL,
  agent_id INT NOT NULL,
  client_id INT NOT NULL,
  property_id INT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  type appointment_type DEFAULT 'site_visit',
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(lead_id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
  FOREIGN KEY (client_id) REFERENCES clients(client_id),
  FOREIGN KEY (property_id) REFERENCES properties(property_id)
);

-- ============================================
-- DEALS TABLE
-- ============================================

CREATE TABLE deals (
  deal_id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL,
  property_id INT NOT NULL,
  agent_id INT NOT NULL,
  client_id INT NOT NULL,
  final_price DECIMAL(15,2) NOT NULL,
  commission_amount DECIMAL(15,2),
  status deal_status DEFAULT 'pending',
  deal_date DATE,
  closing_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(lead_id),
  FOREIGN KEY (property_id) REFERENCES properties(property_id),
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
  FOREIGN KEY (client_id) REFERENCES clients(client_id)
);

-- ============================================
-- CONTRACTS TABLE
-- ============================================

CREATE TABLE contracts (
  contract_id SERIAL PRIMARY KEY,
  deal_id INT NOT NULL,
  document_url VARCHAR(1000),
  contract_type contract_type NOT NULL,
  signed_date DATE,
  expiry_date DATE,
  status contract_status DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deal_id) REFERENCES deals(deal_id) ON DELETE CASCADE
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================

CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  deal_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_type payment_type NOT NULL,
  status payment_status DEFAULT 'pending',
  payment_date DATE,
  reference_no VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deal_id) REFERENCES deals(deal_id)
);

-- ============================================
-- DEAL AUDIT LOG TABLE
-- ============================================

CREATE TABLE deal_audit_log (
  log_id SERIAL PRIMARY KEY,
  deal_id INT NOT NULL,
  old_status deal_status,
  new_status deal_status NOT NULL,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_agentId ON users(agentId);

-- Agencies indexes
CREATE INDEX idx_agencies_email ON agencies(email);

-- Agents indexes
CREATE INDEX idx_agents_agency_id ON agents(agency_id);
CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_agents_is_active ON agents(is_active);

-- Clients indexes
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_client_type ON clients(client_type);

-- Properties indexes
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_city ON properties(city);

-- Property images indexes
CREATE INDEX idx_property_images_property_id ON property_images(property_id);

-- Tags indexes
CREATE INDEX idx_tags_name ON tags(name);

-- Leads indexes
CREATE INDEX idx_leads_client_id ON leads(client_id);
CREATE INDEX idx_leads_property_id ON leads(property_id);
CREATE INDEX idx_leads_agent_id ON leads(agent_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_is_stale ON leads(is_stale);
CREATE INDEX idx_leads_last_activity ON leads(last_activity);

-- Lead tags indexes
CREATE INDEX idx_lead_tags_tag_id ON lead_tags(tag_id);

-- Appointments indexes
CREATE INDEX idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX idx_appointments_agent_id ON appointments(agent_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_property_id ON appointments(property_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);

-- Deals indexes
CREATE INDEX idx_deals_lead_id ON deals(lead_id);
CREATE INDEX idx_deals_property_id ON deals(property_id);
CREATE INDEX idx_deals_agent_id ON deals(agent_id);
CREATE INDEX idx_deals_client_id ON deals(client_id);
CREATE INDEX idx_deals_status ON deals(status);

-- Contracts indexes
CREATE INDEX idx_contracts_deal_id ON contracts(deal_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- Payments indexes
CREATE INDEX idx_payments_deal_id ON payments(deal_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_type ON payments(payment_type);

-- Deal audit log indexes
CREATE INDEX idx_deal_audit_log_deal_id ON deal_audit_log(deal_id);
CREATE INDEX idx_deal_audit_log_changed_at ON deal_audit_log(changed_at);
