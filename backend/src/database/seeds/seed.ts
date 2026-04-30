import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'proptrack',
    password: process.env.DB_PASSWORD || 'proptrack_secret',
    database: process.env.DB_DATABASE || 'proptrack_db',
    synchronize: false,
    entities: [],
  });

  await dataSource.initialize();
  const q = dataSource.query.bind(dataSource);

  console.log('🌱 Seeding PropTrack CRM...');

  // Admin user
  const hash = await bcrypt.hash('Admin1234!', 10);
  await q(`INSERT INTO users (email, password, role) VALUES ('admin@proptrack.com', $1, 'admin') ON CONFLICT (email) DO NOTHING`, [hash]);

  // Agency
  await q(`INSERT INTO agencies (name, address, phone, email) VALUES
    ('Dubai Realty Group', 'Downtown Dubai, UAE', '+97141234567', 'info@dubairealty.com')
    ON CONFLICT (email) DO NOTHING`);
  const [agency] = await q(`SELECT agency_id FROM agencies WHERE email = 'info@dubairealty.com'`);

  // Agents
  await q(`INSERT INTO agents (agency_id, first_name, last_name, email, phone, commission_rate) VALUES
    ($1, 'Mohammed', 'Al Rashid', 'm.rashid@dubairealty.com', '+971509876543', 0.025),
    ($1, 'Sara', 'Khan',       's.khan@dubairealty.com',   '+971501112222', 0.030),
    ($1, 'James', 'Carter',    'j.carter@dubairealty.com', '+971503334444', 0.020)
    ON CONFLICT (email) DO NOTHING`, [agency.agency_id]);
  const agents = await q(`SELECT agent_id FROM agents WHERE agency_id = $1 ORDER BY agent_id`, [agency.agency_id]);

  // Clients
  const clients = [
    ['Sarah', 'Johnson', 'sarah.j@email.com', '+971521234567', 'buyer', 'British'],
    ['Ahmed', 'Hassan', 'a.hassan@email.com', '+971522345678', 'buyer', 'Emirati'],
    ['Priya', 'Sharma', 'p.sharma@email.com', '+971523456789', 'renter', 'Indian'],
    ['Robert', 'Smith', 'r.smith@email.com', '+971524567890', 'seller', 'American'],
    ['Fatima', 'Al Zaabi', 'f.alzaabi@email.com', '+971525678901', 'landlord', 'Emirati'],
    ['Liu', 'Wei', 'l.wei@email.com', '+971526789012', 'buyer', 'Chinese'],
    ['Emma', 'Wilson', 'e.wilson@email.com', '+971527890123', 'buyer', 'Australian'],
    ['Khalid', 'Al Maktoum', 'k.almaktoum@email.com', '+971528901234', 'buyer', 'Emirati'],
    ['Anna', 'Petrov', 'a.petrov@email.com', '+971529012345', 'renter', 'Russian'],
    ['Carlos', 'Mendez', 'c.mendez@email.com', '+971520123456', 'buyer', 'Spanish'],
  ];
  for (const [fn, ln, em, ph, ct, nat] of clients) {
    await q(`INSERT INTO clients (first_name, last_name, email, phone, client_type, nationality)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING`, [fn, ln, em, ph, ct, nat]);
  }
  const clientRows = await q(`SELECT client_id FROM clients ORDER BY client_id LIMIT 10`);

  // Properties (15)
  const props = [
    ['Luxury 2BR Downtown', 'Sheikh Mohammed Bin Rashid Blvd', 'Dubai', 2500000, 1200, 'apartment', 2, 2],
    ['Spacious Villa JBR', 'Jumeirah Beach Residence', 'Dubai', 8500000, 5000, 'villa', 5, 4],
    ['Studio in Marina', 'Dubai Marina Walk', 'Dubai', 950000, 550, 'apartment', 0, 1],
    ['3BR Palm Jumeirah', 'Palm Jumeirah', 'Dubai', 5200000, 2800, 'apartment', 3, 3],
    ['Office Space DIFC', 'Gate Avenue, DIFC', 'Dubai', 3200000, 1800, 'office', 0, 2],
    ['Townhouse Arabian', 'Arabian Ranches', 'Dubai', 3800000, 3200, 'townhouse', 4, 3],
    ['1BR City Walk', 'City Walk', 'Dubai', 1450000, 780, 'apartment', 1, 1],
    ['Villa Meadows', 'The Meadows', 'Dubai', 7200000, 6000, 'villa', 6, 5],
    ['Retail Shop Downtown', 'Old Town Island', 'Dubai', 2800000, 900, 'retail', 0, 1],
    ['2BR Business Bay', 'Business Bay', 'Dubai', 1850000, 1100, 'apartment', 2, 2],
    ['Land Plot Dubailand', 'Dubailand', 'Dubai', 4500000, 10000, 'land', 0, 0],
    ['Studio Sports City', 'Dubai Sports City', 'Dubai', 680000, 480, 'apartment', 0, 1],
    ['3BR Jumeirah', 'Jumeirah 1', 'Dubai', 4100000, 2400, 'villa', 3, 3],
    ['Office Tower TECOM', 'TECOM', 'Dubai', 2200000, 1500, 'office', 0, 2],
    ['4BR Hills Estate', 'Dubai Hills Estate', 'Dubai', 6800000, 4500, 'villa', 4, 4],
  ];
  for (let i = 0; i < props.length; i++) {
    const [title, location, city, price, area, ptype, beds, baths] = props[i];
    const agentId = agents[i % agents.length].agent_id;
    await q(`INSERT INTO properties (agent_id, title, location, city, price, area_sqft, property_type, bedrooms, bathrooms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [agentId, title, location, city, price, area, ptype, beds, baths]);
  }
  const propertyRows = await q(`SELECT property_id, agent_id FROM properties ORDER BY property_id LIMIT 15`);

  // Tags
  await q(`INSERT INTO tags (name, color) VALUES
    ('Hot Lead','#EF4444'), ('Price Drop','#F97316'), ('VIP Client','#8B5CF6'),
    ('Follow Up','#3B82F6'), ('Ready to Buy','#10B981')
    ON CONFLICT (name) DO NOTHING`);

  // Leads (20)
  for (let i = 0; i < 20; i++) {
    const client = clientRows[i % clientRows.length];
    const prop = propertyRows[i % propertyRows.length];
    const agentId = agents[i % agents.length].agent_id;
    const statuses = ['new','contacted','visit_scheduled','offer_made','new','contacted'];
    const status = statuses[i % statuses.length];
    try {
      await q(`INSERT INTO leads (client_id, property_id, agent_id, status, budget, notes)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [client.client_id, prop.property_id, agentId, status,
         Math.round(Number(prop.price ?? 1000000) * 0.95), 'Interested in the property']);
    } catch (_) { /* skip duplicate */ }
  }

  console.log('✅ Seeding complete!');
  console.log('   Admin login: admin@proptrack.com / Admin1234!');
  await dataSource.destroy();
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
