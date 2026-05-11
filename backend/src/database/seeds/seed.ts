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
  await q(
    `INSERT INTO users (email, password, role) VALUES ('admin@proptrack.com', $1, 'admin') ON CONFLICT (email) DO NOTHING`,
    [hash],
  );

  // Agency
  await q(`INSERT INTO agencies (name, address, phone, email) VALUES
    ('Dubai Realty Group', 'Downtown Dubai, UAE', '+97141234567', 'info@dubairealty.com')
    ON CONFLICT (email) DO NOTHING`);
  const [agency] = await q(
    `SELECT agency_id FROM agencies WHERE email = 'info@dubairealty.com'`,
  );

  // Agents
  await q(
    `INSERT INTO agents (agency_id, first_name, last_name, email, phone, commission_rate) VALUES
    ($1, 'Mohammed', 'Al Rashid', 'm.rashid@dubairealty.com', '+971509876543', 0.025),
    ($1, 'Sara', 'Khan',       's.khan@dubairealty.com',   '+971501112222', 0.030),
    ($1, 'James', 'Carter',    'j.carter@dubairealty.com', '+971503334444', 0.020)
    ON CONFLICT (email) DO NOTHING`,
    [agency.agency_id],
  );
  const agents = await q(
    `SELECT agent_id, commission_rate FROM agents WHERE agency_id = $1 ORDER BY agent_id`,
    [agency.agency_id],
  );

  // Clients
  const clients = [
    [
      'Sarah',
      'Johnson',
      'sarah.j@email.com',
      '+971521234567',
      'buyer',
      'British',
    ],
    [
      'Ahmed',
      'Hassan',
      'a.hassan@email.com',
      '+971522345678',
      'buyer',
      'Emirati',
    ],
    [
      'Priya',
      'Sharma',
      'p.sharma@email.com',
      '+971523456789',
      'renter',
      'Indian',
    ],
    [
      'Robert',
      'Smith',
      'r.smith@email.com',
      '+971524567890',
      'seller',
      'American',
    ],
    [
      'Fatima',
      'Al Zaabi',
      'f.alzaabi@email.com',
      '+971525678901',
      'landlord',
      'Emirati',
    ],
    ['Liu', 'Wei', 'l.wei@email.com', '+971526789012', 'buyer', 'Chinese'],
    [
      'Emma',
      'Wilson',
      'e.wilson@email.com',
      '+971527890123',
      'buyer',
      'Australian',
    ],
    [
      'Khalid',
      'Al Maktoum',
      'k.almaktoum@email.com',
      '+971528901234',
      'buyer',
      'Emirati',
    ],
    [
      'Anna',
      'Petrov',
      'a.petrov@email.com',
      '+971529012345',
      'renter',
      'Russian',
    ],
    [
      'Carlos',
      'Mendez',
      'c.mendez@email.com',
      '+971520123456',
      'buyer',
      'Spanish',
    ],
  ];
  for (const [fn, ln, em, ph, ct, nat] of clients) {
    await q(
      `INSERT INTO clients (first_name, last_name, email, phone, client_type, nationality)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING`,
      [fn, ln, em, ph, ct, nat],
    );
  }
  const clientRows = await q(
    `SELECT client_id FROM clients ORDER BY client_id LIMIT 10`,
  );

  // Properties (15)
  const props = [
    [
      'Luxury 2BR Downtown',
      'Sheikh Mohammed Bin Rashid Blvd',
      'Dubai',
      2500000,
      1200,
      'apartment',
      2,
      2,
    ],
    [
      'Spacious Villa JBR',
      'Jumeirah Beach Residence',
      'Dubai',
      8500000,
      5000,
      'villa',
      5,
      4,
    ],
    [
      'Studio in Marina',
      'Dubai Marina Walk',
      'Dubai',
      950000,
      550,
      'apartment',
      0,
      1,
    ],
    [
      '3BR Palm Jumeirah',
      'Palm Jumeirah',
      'Dubai',
      5200000,
      2800,
      'apartment',
      3,
      3,
    ],
    [
      'Office Space DIFC',
      'Gate Avenue, DIFC',
      'Dubai',
      3200000,
      1800,
      'office',
      0,
      2,
    ],
    [
      'Townhouse Arabian',
      'Arabian Ranches',
      'Dubai',
      3800000,
      3200,
      'townhouse',
      4,
      3,
    ],
    ['1BR City Walk', 'City Walk', 'Dubai', 1450000, 780, 'apartment', 1, 1],
    ['Villa Meadows', 'The Meadows', 'Dubai', 7200000, 6000, 'villa', 6, 5],
    [
      'Retail Shop Downtown',
      'Old Town Island',
      'Dubai',
      2800000,
      900,
      'retail',
      0,
      1,
    ],
    [
      '2BR Business Bay',
      'Business Bay',
      'Dubai',
      1850000,
      1100,
      'apartment',
      2,
      2,
    ],
    ['Land Plot Dubailand', 'Dubailand', 'Dubai', 4500000, 10000, 'land', 0, 0],
    [
      'Studio Sports City',
      'Dubai Sports City',
      'Dubai',
      680000,
      480,
      'apartment',
      0,
      1,
    ],
    ['3BR Jumeirah', 'Jumeirah 1', 'Dubai', 4100000, 2400, 'villa', 3, 3],
    ['Office Tower TECOM', 'TECOM', 'Dubai', 2200000, 1500, 'office', 0, 2],
    [
      '4BR Hills Estate',
      'Dubai Hills Estate',
      'Dubai',
      6800000,
      4500,
      'villa',
      4,
      4,
    ],
  ];
  for (let i = 0; i < props.length; i++) {
    const [title, location, city, price, area, ptype, beds, baths] = props[i];
    const agentId = agents[i % agents.length].agent_id;
    await q(
      `INSERT INTO properties (agent_id, title, location, city, price, area_sqft, property_type, bedrooms, bathrooms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [agentId, title, location, city, price, area, ptype, beds, baths],
    );
  }
  const propertyRows = await q(
    `SELECT property_id, agent_id FROM properties ORDER BY property_id LIMIT 15`,
  );

  const propertyImages = [
    // prop index 0 — Luxury 2BR Downtown
    [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      true,
      'Building exterior',
    ],
    [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      false,
      'Living room',
    ],
    [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      false,
      'Pool area',
    ],

    // prop index 1 — Spacious Villa JBR
    [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      true,
      'Villa exterior',
    ],
    [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      false,
      'Master bedroom',
    ],
    [
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800',
      false,
      'Sea view',
    ],

    // prop index 2 — Studio in Marina
    [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      true,
      'Marina view',
    ],
    [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      false,
      'Studio interior',
    ],
    [
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
      false,
      'Building lobby',
    ],

    // prop index 3 — 3BR Palm Jumeirah
    [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
      true,
      'Palm aerial',
    ],
    [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      false,
      'Living room',
    ],
    [
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800',
      false,
      'Master bedroom',
    ],

    // prop index 4 — Office Space DIFC
    [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      true,
      'Office exterior',
    ],
    [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
      false,
      'Open plan office',
    ],
    [
      'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800',
      false,
      'Meeting room',
    ],

    // prop index 5 — Townhouse Arabian
    [
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800',
      true,
      'Townhouse exterior',
    ],
    [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
      false,
      'Living area',
    ],
    [
      'https://images.unsplash.com/photo-1572912498456-d8b0b19a3af4?w=800',
      false,
      'Community pool',
    ],

    // prop index 6 — 1BR City Walk
    [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      true,
      'City Walk exterior',
    ],
    [
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
      false,
      'Bedroom',
    ],
    [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      false,
      'Kitchen',
    ],

    // prop index 7 — Villa Meadows
    [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      true,
      'Villa front',
    ],
    [
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
      false,
      'Living room',
    ],
    [
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800',
      false,
      'Private pool',
    ],

    // prop index 8 — Retail Shop Downtown
    [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      true,
      'Shop frontage',
    ],
    [
      'https://images.unsplash.com/photo-1560472355-536de3962603?w=800',
      false,
      'Retail interior',
    ],
    [
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      false,
      'Old Town area',
    ],

    // prop index 9 — 2BR Business Bay
    [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      true,
      'Canal view',
    ],
    [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      false,
      'Living room',
    ],
    [
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
      false,
      'Bedroom',
    ],

    // prop index 10 — Land Plot Dubailand
    [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      true,
      'Aerial land view',
    ],
    [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      false,
      'Plot boundary',
    ],
    [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
      false,
      'Nearby development',
    ],

    // prop index 11 — Studio Sports City
    [
      'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800',
      true,
      'Building exterior',
    ],
    [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      false,
      'Studio interior',
    ],
    [
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
      false,
      'Sports facilities',
    ],

    // prop index 12 — 3BR Jumeirah
    [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
      true,
      'Villa exterior',
    ],
    [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      false,
      'Living room',
    ],
    [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      false,
      'Garden',
    ],

    // prop index 13 — Office Tower TECOM
    [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      true,
      'Tower exterior',
    ],
    [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
      false,
      'Office floor',
    ],
    [
      'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800',
      false,
      'Reception',
    ],

    // prop index 14 — 4BR Hills Estate
    [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      true,
      'Hills villa exterior',
    ],
    [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800',
      false,
      'Open plan living',
    ],
    [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
      false,
      'Garden with pool',
    ],
  ];

  for (let i = 0; i < propertyImages.length; i++) {
    const propIndex = Math.floor(i / 3);
    const prop = propertyRows[propIndex];
    const [url, isPrimary] = propertyImages[i];
    if (!prop) continue;
    await q(
      `INSERT INTO property_images (property_id, image_url, is_primary)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [prop.property_id, url, isPrimary],
    );
  }

  console.log('   ✅ Property images seeded (45 images, 3 per property)');

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
    const statuses = [
      'new',
      'contacted',
      'visit_scheduled',
      'offer_made',
      'new',
      'contacted',
    ];
    const status = statuses[i % statuses.length];
    try {
      await q(
        `INSERT INTO leads (client_id, property_id, agent_id, status, budget, notes)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          client.client_id,
          prop.property_id,
          agentId,
          status,
          Math.round(Number(prop.price ?? 1000000) * 0.95),
          'Interested in the property',
        ],
      );
    } catch {
      /* skip duplicate */
    }
  }

  const leadRows = await q(
    `SELECT lead_id, client_id, property_id, agent_id, budget
     FROM leads
     WHERE agent_id = ANY($1::int[])
     ORDER BY lead_id
     LIMIT 20`,
    [agents.map((agent: { agent_id: number }) => agent.agent_id)],
  );

  // Appointments for the demo calendar/activity views
  const appointments = [
    [
      0,
      'site_visit',
      'completed',
      -18,
      'Downtown viewing completed. Client requested service charge details.',
    ],
    [
      1,
      'call',
      'completed',
      -15,
      'Follow-up call completed. Financing pre-approval expected this week.',
    ],
    [
      2,
      'site_visit',
      'completed',
      -12,
      'Marina studio tour completed. Client liked the building amenities.',
    ],
    [
      3,
      'meeting',
      'completed',
      -9,
      'Offer strategy meeting completed with buyer.',
    ],
    [
      4,
      'site_visit',
      'scheduled',
      1,
      'DIFC office walkthrough with operations team.',
    ],
    [5, 'site_visit', 'scheduled', 2, 'Arabian Ranches family viewing.'],
    [6, 'call', 'scheduled', 3, 'Price discussion and document checklist.'],
    [7, 'meeting', 'scheduled', 4, 'Seller meeting to review villa offer.'],
    [8, 'site_visit', 'scheduled', 5, 'Retail unit inspection with investor.'],
    [9, 'call', 'scheduled', 6, 'Business Bay shortlist review.'],
    [
      10,
      'site_visit',
      'cancelled',
      -4,
      'Client postponed plot visit due to travel.',
    ],
    [
      11,
      'site_visit',
      'no_show',
      -2,
      'Client did not attend Sports City studio viewing.',
    ],
  ];

  for (const [leadIndex, type, status, dayOffset, notes] of appointments) {
    const lead = leadRows[Number(leadIndex) % leadRows.length];
    if (!lead) continue;

    await q(
      `INSERT INTO appointments (
        lead_id, agent_id, client_id, property_id, scheduled_at, type, status, notes
      )
      SELECT $1, $2, $3, $4, (CURRENT_DATE + $5::int) + TIME '10:30', $6, $7, $8
      WHERE NOT EXISTS (
        SELECT 1 FROM appointments WHERE lead_id = $1 AND scheduled_at::date = CURRENT_DATE + $5::int
      )`,
      [
        lead.lead_id,
        lead.agent_id,
        lead.client_id,
        lead.property_id,
        dayOffset,
        type,
        status,
        notes,
      ],
    );
  }

  // Deals across pending, active, and closed states for revenue/pipeline demos
  const dealSeeds = [
    [0, 2450000, 'closed', -20, -3],
    [1, 8250000, 'active', -12, 18],
    [2, 910000, 'closed', -16, -1],
    [3, 5050000, 'pending', -5, 28],
    [5, 3725000, 'active', -7, 21],
    [9, 1800000, 'closed', -24, -8],
  ];

  for (const [
    leadIndex,
    finalPrice,
    status,
    dealOffset,
    closingOffset,
  ] of dealSeeds) {
    const lead = leadRows[Number(leadIndex) % leadRows.length];
    const agent = agents.find(
      (agent: { agent_id: number }) => agent.agent_id === lead?.agent_id,
    );
    if (!lead || !agent) continue;

    const commissionAmount = Math.round(
      Number(finalPrice) * Number(agent.commission_rate ?? 0.025),
    );

    await q(
      `INSERT INTO deals (
        lead_id, property_id, agent_id, client_id, final_price, commission_amount,
        status, deal_date, closing_date
      )
      SELECT $1, $2, $3, $4, $5, $6, $7,
        CURRENT_DATE + $8::int,
        CURRENT_DATE + $9::int
      WHERE NOT EXISTS (SELECT 1 FROM deals WHERE lead_id = $1)`,
      [
        lead.lead_id,
        lead.property_id,
        lead.agent_id,
        lead.client_id,
        finalPrice,
        commissionAmount,
        status,
        dealOffset,
        closingOffset,
      ],
    );

    if (status === 'closed') {
      await q(`UPDATE leads SET status = 'deal_closed' WHERE lead_id = $1`, [
        lead.lead_id,
      ]);
    }
  }

  const dealRows = await q(
    `SELECT deal_id, final_price, commission_amount, status
     FROM deals
     WHERE lead_id = ANY($1::int[])
     ORDER BY deal_id`,
    [leadRows.map((lead: { lead_id: number }) => lead.lead_id)],
  );

  // Contracts tied to seeded deals
  for (const deal of dealRows) {
    const isClosed = deal.status === 'closed';
    const isPending = deal.status === 'pending';
    const contractType = Number(deal.final_price) < 1000000 ? 'rental' : 'sale';
    const contractStatus = isClosed ? 'signed' : isPending ? 'draft' : 'sent';

    await q(
      `INSERT INTO contracts (
        deal_id, document_url, contract_type, signed_date, expiry_date, status
      )
      SELECT $1, $2, $3,
        CASE WHEN $4::boolean THEN CURRENT_DATE - 2 ELSE NULL END,
        CURRENT_DATE + 365,
        $5
      WHERE NOT EXISTS (SELECT 1 FROM contracts WHERE deal_id = $1)`,
      [
        deal.deal_id,
        `/demo/contracts/deal-${deal.deal_id}.pdf`,
        contractType,
        isClosed,
        contractStatus,
      ],
    );
  }

  // Payments for finance dashboard demos
  for (const deal of dealRows) {
    const isClosed = deal.status === 'closed';
    const depositAmount = Math.round(Number(deal.final_price) * 0.1);

    await q(
      `INSERT INTO payments (
        deal_id, amount, payment_type, status, payment_date, reference_no
      )
      SELECT $1, $2, 'deposit', $3, CURRENT_DATE - 1, $4
      WHERE NOT EXISTS (SELECT 1 FROM payments WHERE reference_no = $4)`,
      [
        deal.deal_id,
        depositAmount,
        isClosed ? 'completed' : 'pending',
        `DRG-${deal.deal_id}-DEP`,
      ],
    );

    if (isClosed && Number(deal.commission_amount) > 0) {
      await q(
        `INSERT INTO payments (
          deal_id, amount, payment_type, status, payment_date, reference_no
        )
        SELECT $1, $2, 'commission', 'completed', CURRENT_DATE, $3
        WHERE NOT EXISTS (SELECT 1 FROM payments WHERE reference_no = $3)`,
        [deal.deal_id, deal.commission_amount, `DRG-${deal.deal_id}-COM`],
      );
    }
  }

  console.log('✅ Seeding complete!');
  console.log('   Admin login: admin@proptrack.com / Admin1234!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
