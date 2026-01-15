const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'crm.db');

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

// Helper for dates
const now = new Date();
const daysAgo = (days) => new Date(new Date().setDate(now.getDate() - days)).toISOString();
const futureDate = (days) => new Date(new Date().setDate(now.getDate() + days)).toISOString();

// Mock Data for Seeding
const MOCK_COMPANIES = [
  {
    id: '1',
    name: 'Vercel',
    logo: 'https://picsum.photos/24/24?random=1',
    domain: 'vercel.com',
    links: JSON.stringify([{ label: 'LinkedIn', url: '#' }, { label: 'Crunchbase', url: '#' }]),
    specialOffers: JSON.stringify(['Demand Gen', 'AI Max']),
    pointOfContactId: 'p1',
    notes: 'Key strategic partner for Q3.',
    nextTaskDate: futureDate(5),
    externalId: 'CID-9928',
    loggingStage: JSON.stringify(['Call Logged', 'In progress']),
    groundControl: JSON.stringify(['To Keep']),
    sensitiveVertical: 0, // boolean to 0/1
    quarters: 'Q1 2026',
    nal: 0,
    createdAt: daysAgo(300)
  },
  {
    id: '2',
    name: 'DigitalOcean',
    logo: 'https://picsum.photos/24/24?random=2',
    domain: 'digitalocean.com',
    links: JSON.stringify([{ label: 'Website', url: '#' }]),
    specialOffers: JSON.stringify(['Launch P MAX']),
    pointOfContactId: null,
    notes: 'Discussing infrastructure overhaul.',
    nextTaskDate: futureDate(1),
    externalId: 'CID-1120',
    loggingStage: JSON.stringify(['Email Logged']),
    groundControl: JSON.stringify(['Rollover']),
    sensitiveVertical: 1,
    quarters: 'Q4 2025',
    nal: 1,
    createdAt: daysAgo(280)
  },
  {
    id: '3',
    name: 'GitHub',
    logo: 'https://picsum.photos/24/24?random=3',
    domain: 'github.com',
    links: JSON.stringify([{ label: 'GitHub', url: '#' }]),
    specialOffers: JSON.stringify(['NCA', 'ECL']),
    pointOfContactId: 'p2',
    notes: '',
    nextTaskDate: null,
    externalId: 'CID-3321',
    loggingStage: JSON.stringify(['Call scheduled']),
    groundControl: JSON.stringify(['To Remove']),
    sensitiveVertical: 0,
    quarters: 'Q1 2026',
    nal: 0,
    createdAt: daysAgo(250)
  },
  {
    id: '4',
    name: 'Stripe',
    logo: 'https://picsum.photos/24/24?random=4',
    domain: 'stripe.com',
    links: JSON.stringify([]),
    specialOffers: JSON.stringify(['VBB', 'Smart Bid']),
    pointOfContactId: 'p3',
    notes: 'Waiting on legal review.',
    nextTaskDate: futureDate(30),
    externalId: 'CID-5543',
    loggingStage: JSON.stringify(['Standby']),
    groundControl: JSON.stringify(['To Keep']),
    sensitiveVertical: 1,
    quarters: 'Q2 2026',
    nal: 0,
    createdAt: daysAgo(220)
  },
  {
    id: '5',
    name: 'Figma',
    logo: 'https://picsum.photos/24/24?random=5',
    domain: 'figma.com',
    links: JSON.stringify([{ label: 'Design System', url: '#' }]),
    specialOffers: JSON.stringify(['Gateway']),
    pointOfContactId: 'p4',
    notes: 'Renewal discussion pending.',
    nextTaskDate: futureDate(0),
    externalId: 'CID-8877',
    loggingStage: JSON.stringify(['Call Logged']),
    groundControl: JSON.stringify(['To Keep']),
    sensitiveVertical: 0,
    quarters: 'Q3 2025',
    nal: 0,
    createdAt: daysAgo(200)
  }
];

const MOCK_PEOPLE = [
  {
    id: 'p1',
    name: 'Guillermo Rauch',
    email: 'guillermo@vercel.com',
    avatar: 'https://picsum.photos/32/32?random=100',
    companyId: '1',
    role: 'CEO',
    phone: '+1 555-0101',
    location: 'San Francisco, CA',
    lastInteraction: daysAgo(2),
    connectionStrength: 'Strong',
    createdAt: daysAgo(200),
    description: '',
    linkedIn: '',
    tags: JSON.stringify([])
  },
  {
    id: 'p2',
    name: 'Nat Friedman',
    email: 'nat@github.com',
    avatar: 'https://picsum.photos/32/32?random=101',
    companyId: '3',
    role: 'Advisor',
    phone: '+1 555-0102',
    location: 'San Francisco, CA',
    lastInteraction: daysAgo(7),
    connectionStrength: 'Moderate',
    createdAt: daysAgo(180),
    description: '',
    linkedIn: '',
    tags: JSON.stringify([])
  },
  {
    id: 'p3',
    name: 'Patrick Collison',
    email: 'patrick@stripe.com',
    avatar: 'https://picsum.photos/32/32?random=102',
    companyId: '4',
    role: 'CEO',
    phone: '+1 555-0103',
    location: 'Dublin, Ireland',
    lastInteraction: daysAgo(1),
    connectionStrength: 'Strong',
    createdAt: daysAgo(150),
    description: '',
    linkedIn: '',
    tags: JSON.stringify([])
  },
  {
    id: 'p4',
    name: 'Dylan Field',
    email: 'dylan@figma.com',
    avatar: 'https://picsum.photos/32/32?random=103',
    companyId: '5',
    role: 'CEO',
    location: 'New York, NY',
    lastInteraction: daysAgo(90),
    connectionStrength: 'Weak',
    createdAt: daysAgo(120),
    description: '',
    linkedIn: '',
    tags: JSON.stringify([])
  },
  {
    id: 'p5',
    name: 'Des Traynor',
    email: 'des@intercom.com',
    avatar: 'https://picsum.photos/32/32?random=104',
    companyId: '6',
    role: 'Co-founder',
    phone: '+1 555-0105',
    location: 'Dublin, Ireland',
    lastInteraction: '',
    connectionStrength: 'None',
    createdAt: daysAgo(100),
    description: '',
    linkedIn: '',
    tags: JSON.stringify([])
  },
  {
    id: 'p6',
    name: 'Steve Mill',
    email: 'steve@vercel.com',
    avatar: 'https://picsum.photos/32/32?random=105',
    companyId: '1',
    role: 'VP Sales',
    phone: '+1 555-0106',
    location: 'Remote',
    lastInteraction: daysAgo(0),
    connectionStrength: 'Moderate',
    createdAt: daysAgo(90),
    description: '',
    linkedIn: '',
    tags: JSON.stringify([])
  }
];

const MOCK_TASKS = [
  {
    id: '1',
    title: 'Prepare quarterly review deck',
    isCompleted: 0,
    dueDate: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
    assignedTo: 'you',
    createdBy: 'you',
    createdAt: new Date(daysAgo(10)).toISOString(),
    linkedCompanyId: '1',
    description: ''
  },
  {
    id: '2',
    title: 'Email Patrick regarding API access',
    isCompleted: 0,
    dueDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    assignedTo: 'u1',
    createdBy: 'you',
    createdAt: new Date(daysAgo(9)).toISOString(),
    linkedCompanyId: '4',
    description: ''
  },
  {
    id: '3',
    title: 'Schedule demo with Figma team',
    isCompleted: 0,
    dueDate: new Date().toISOString(),
    assignedTo: 'u2',
    createdBy: 'u1',
    createdAt: new Date(daysAgo(5)).toISOString(),
    linkedCompanyId: '5',
    description: ''
  },
  {
    id: '4',
    title: 'Update billing information',
    isCompleted: 1,
    dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    assignedTo: 'you',
    createdBy: 'you',
    createdAt: new Date(daysAgo(4)).toISOString(),
    linkedCompanyId: '2',
    description: ''
  }
];

const MOCK_DEALS = [
  { id: '1', companyName: 'Loom', companyLogo: 'https://picsum.photos/24/24?random=10', ownerName: 'Sofia Martinez', ownerAvatar: 'https://picsum.photos/32/32?random=20', value: 20700.00, stage: 'Lead', tags: JSON.stringify(['Pro']), lastActivity: 'Jan 17, 2024', comments: 1, tasks: 1 },
  { id: '2', companyName: 'Vercel - Expansion', companyLogo: 'https://picsum.photos/24/24?random=1', ownerName: 'Emily Carter', ownerAvatar: 'https://picsum.photos/32/32?random=21', value: 45000.00, stage: 'Lead', tags: JSON.stringify([]), lastActivity: 'Jan 19, 2024', comments: 0, tasks: 0 },
  { id: '3', companyName: 'GitHub - x20 Enterprise', companyLogo: 'https://picsum.photos/24/24?random=3', ownerName: 'Ethan Blake', ownerAvatar: 'https://picsum.photos/32/32?random=22', value: 13500.00, stage: 'Contacted', tags: JSON.stringify(['Enterprise']), lastActivity: 'Dec 21, 2024', comments: 2, tasks: 8 },
  { id: '4', companyName: 'Slack - Expansion', companyLogo: 'https://picsum.photos/24/24?random=9', ownerName: 'Emily Carter', ownerAvatar: 'https://picsum.photos/32/32?random=21', value: 85000.00, stage: 'Contacted', tags: JSON.stringify([]), lastActivity: 'Feb 01, 2025', comments: 5, tasks: 2 },
  { id: '5', companyName: 'Stripe', companyLogo: 'https://picsum.photos/24/24?random=4', ownerName: 'Lucas Weber', ownerAvatar: 'https://picsum.photos/32/32?random=23', value: 30620.00, stage: 'Qualification', tags: JSON.stringify(['Plus']), lastActivity: 'Jan 17, 2025', comments: 6, tasks: 0 },
  { id: '6', companyName: 'Customer.io - x10 Plus', companyLogo: 'https://picsum.photos/24/24?random=11', ownerName: 'Mike Fischer', ownerAvatar: 'https://picsum.photos/32/32?random=24', value: 12000.00, stage: 'Qualification', tags: JSON.stringify([]), lastActivity: 'Jan 28, 2025', comments: 1, tasks: 3 },
  { id: '7', companyName: 'Figma', companyLogo: 'https://picsum.photos/24/24?random=5', ownerName: 'Mike Fischer', ownerAvatar: 'https://picsum.photos/32/32?random=24', value: 18000.00, stage: 'Evaluation', tags: JSON.stringify(['Enterprise']), lastActivity: 'Oct 26, 2024', comments: 1, tasks: 1 },
  { id: '8', companyName: 'Linear - Expansion', companyLogo: 'https://picsum.photos/24/24?random=12', ownerName: 'Ethan Blake', ownerAvatar: 'https://picsum.photos/32/32?random=22', value: 5000.00, stage: 'Evaluation', tags: JSON.stringify([]), lastActivity: 'Nov 12, 2024', comments: 4, tasks: 2 },
];


function initDb() {
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT,
      logo TEXT,
      domain TEXT,
      links TEXT,
      specialOffers TEXT,
      pointOfContactId TEXT,
      notes TEXT,
      nextTaskDate TEXT,
      externalId TEXT,
      loggingStage TEXT,
      groundControl TEXT,
      sensitiveVertical INTEGER,
      quarters TEXT,
      nal INTEGER,
      createdAt TEXT
    )
  `, (err) => {
    if (!err) {
      // Simple check if empty
      db.get("SELECT count(*) as count FROM companies", (err, row) => {
        if (row.count === 0) {
          console.log("Seeding companies...");
          const stmt = db.prepare("INSERT INTO companies VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
          MOCK_COMPANIES.forEach(c => {
            stmt.run(c.id, c.name, c.logo, c.domain, c.links, c.specialOffers, c.pointOfContactId, c.notes, c.nextTaskDate, c.externalId, c.loggingStage, c.groundControl, c.sensitiveVertical, c.quarters, c.nal, c.createdAt);
          });
          stmt.finalize();
        }
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      avatar TEXT,
      companyId TEXT,
      role TEXT,
      phone TEXT,
      location TEXT,
      lastInteraction TEXT,
      connectionStrength TEXT,
      createdAt TEXT,
      description TEXT,
      linkedIn TEXT,
      tags TEXT
    )
  `, (err) => {
    if (!err) {
      db.get("SELECT count(*) as count FROM people", (err, row) => {
        if (row.count === 0) {
          console.log("Seeding people...");
          const stmt = db.prepare("INSERT INTO people VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
          MOCK_PEOPLE.forEach(p => {
            stmt.run(p.id, p.name, p.email, p.avatar, p.companyId, p.role, p.phone, p.location, p.lastInteraction, p.connectionStrength, p.createdAt, p.description, p.linkedIn, p.tags);
          });
          stmt.finalize();
        }
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT,
      isCompleted INTEGER,
      dueDate TEXT,
      assignedTo TEXT,
      createdBy TEXT,
      createdAt TEXT,
      linkedCompanyId TEXT,
      description TEXT
    )
  `, (err) => {
    if (!err) {
      db.get("SELECT count(*) as count FROM tasks", (err, row) => {
        if (row.count === 0) {
          console.log("Seeding tasks...");
          const stmt = db.prepare("INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?)");
          MOCK_TASKS.forEach(t => {
            stmt.run(t.id, t.title, t.isCompleted, t.dueDate, t.assignedTo, t.createdBy, t.createdAt, t.linkedCompanyId, t.description);
          });
          stmt.finalize();
        }
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      companyName TEXT,
      companyLogo TEXT,
      ownerName TEXT,
      ownerAvatar TEXT,
      value REAL,
      stage TEXT,
      tags TEXT,
      lastActivity TEXT,
      comments INTEGER,
      tasks INTEGER,
      createdAt TEXT
    )
  `, (err) => {
    if (!err) {
      db.get("SELECT count(*) as count FROM deals", (err, row) => {
        if (row.count === 0) {
          console.log("Seeding deals...");
          const stmt = db.prepare("INSERT INTO deals VALUES (?,?,?,?,?,?,?,?,?,?,?)");
          MOCK_DEALS.forEach(d => {
            stmt.run(d.id, d.companyName, d.companyLogo, d.ownerName, d.ownerAvatar, d.value, d.stage, d.tags, d.lastActivity, d.comments, d.tasks);
          });
          stmt.finalize();
        }
      });
    }
  });

  // --- NEW FLEXIBLE SCHEMA TABLES ---

  // Objects table: defines database types (Companies, People, Tasks, or custom)
  db.run(`
    CREATE TABLE IF NOT EXISTS objects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      is_system INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (!err) {
      db.get("SELECT count(*) as count FROM objects", (err, row) => {
        if (row.count === 0) {
          console.log("Seeding objects...");
          const systemObjects = [
            { id: 'obj_companies', name: 'Companies', slug: 'companies', icon: 'Building', is_system: 1 },
            { id: 'obj_people', name: 'People', slug: 'people', icon: 'Users', is_system: 1 },
            { id: 'obj_tasks', name: 'Tasks', slug: 'tasks', icon: 'CheckSquare', is_system: 1 },
            { id: 'obj_deals', name: 'Deals', slug: 'deals', icon: 'DollarSign', is_system: 1 }
          ];
          const stmt = db.prepare("INSERT INTO objects (id, name, slug, icon, is_system, created_at) VALUES (?,?,?,?,?,?)");
          systemObjects.forEach(obj => {
            stmt.run(obj.id, obj.name, obj.slug, obj.icon, obj.is_system, new Date().toISOString());
          });
          stmt.finalize();
        }
      });
    }
  });

  // Attributes table: defines fields/columns for each object type
  db.run(`
    CREATE TABLE IF NOT EXISTS attributes (
      id TEXT PRIMARY KEY,
      object_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT,
      is_system INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (!err) {
      db.get("SELECT count(*) as count FROM attributes", (err, row) => {
        if (row.count === 0) {
          console.log("Seeding attributes...");
          // Seed core attributes for Companies
          const companyAttrs = [
            { id: 'attr_comp_name', object_id: 'obj_companies', name: 'Company Name', type: 'text', is_system: 1, position: 0 },
            { id: 'attr_comp_domain', object_id: 'obj_companies', name: 'Domain', type: 'url', is_system: 1, position: 1 },
            { id: 'attr_comp_poc', object_id: 'obj_companies', name: 'Point of Contact', type: 'relation', is_system: 1, position: 2, config: JSON.stringify({ targetObjectId: 'obj_people', cardinality: 'many' }) },
            { id: 'attr_comp_stage', object_id: 'obj_companies', name: 'Logging Stage', type: 'multi-select', is_system: 1, position: 3 },
            { id: 'attr_comp_next_task', object_id: 'obj_companies', name: 'Next Task', type: 'date', is_system: 1, position: 4 },
          ];
          // Seed core attributes for People
          const peopleAttrs = [
            { id: 'attr_ppl_name', object_id: 'obj_people', name: 'Name', type: 'text', is_system: 1, position: 0 },
            { id: 'attr_ppl_email', object_id: 'obj_people', name: 'Email', type: 'email', is_system: 1, position: 1 },
            { id: 'attr_ppl_company', object_id: 'obj_people', name: 'Company', type: 'relation', is_system: 1, position: 2, config: JSON.stringify({ targetObjectId: 'obj_companies', cardinality: 'many' }) },
            { id: 'attr_ppl_role', object_id: 'obj_people', name: 'Role', type: 'text', is_system: 1, position: 3 },
          ];
          // Seed core attributes for Tasks
          const taskAttrs = [
            { id: 'attr_task_title', object_id: 'obj_tasks', name: 'Title', type: 'text', is_system: 1, position: 0 },
            { id: 'attr_task_completed', object_id: 'obj_tasks', name: 'Completed', type: 'checkbox', is_system: 1, position: 1 },
            { id: 'attr_task_due', object_id: 'obj_tasks', name: 'Due Date', type: 'date', is_system: 1, position: 2 },
            { id: 'attr_task_company', object_id: 'obj_tasks', name: 'Linked Company', type: 'relation', is_system: 1, position: 3, config: JSON.stringify({ targetObjectId: 'obj_companies', cardinality: 'many' }) },
          ];

          const stmt = db.prepare("INSERT INTO attributes (id, object_id, name, type, config, is_system, position, created_at) VALUES (?,?,?,?,?,?,?,?)");
          [...companyAttrs, ...peopleAttrs, ...taskAttrs].forEach(attr => {
            stmt.run(attr.id, attr.object_id, attr.name, attr.type, attr.config || null, attr.is_system, attr.position, new Date().toISOString());
          });
          stmt.finalize();
        }
      });
    }
  });

  // Record Relations: Many-to-Many junction table for linking records across objects
  db.run(`
    CREATE TABLE IF NOT EXISTS record_relations (
      id TEXT PRIMARY KEY,
      source_record_id TEXT NOT NULL,
      target_record_id TEXT NOT NULL,
      attribute_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
    )
  `);



  // Migration for deals table to add createdAt if missing
  db.all("PRAGMA table_info(deals)", (err, rows) => {
    if (!err && rows && rows.length > 0) {
      const hasCreatedAt = rows.some(r => r.name === 'createdAt');
      if (!hasCreatedAt) {
        console.log("Migrating deals table: adding createdAt column");
        db.run("ALTER TABLE deals ADD COLUMN createdAt TEXT", (err) => {
          if (err) console.error("Error adding createdAt column to deals:", err.message);
          else console.log("Added createdAt column to deals");
        });
      }
    }
  });
}

// Routes
// Generic CRUD handlers
const handleGet = (table) => (req, res) => {
  db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse JSON fields if necessary
    const parsedRows = rows.map(row => {
      // Heuristic: if key is plural or obviously json, try parse
      for (const key in row) {
        if (typeof row[key] === 'string' && (row[key].startsWith('[') || row[key].startsWith('{'))) {
          try {
            row[key] = JSON.parse(row[key]);
          } catch (e) { }
        }
        // Boolean conversion
        if (table === 'companies' && (key === 'sensitiveVertical' || key === 'nal')) {
          row[key] = !!row[key];
        }
        if (table === 'tasks' && key === 'isCompleted') {
          row[key] = !!row[key];
        }
      }
      return row;
    });
    res.json(parsedRows);
  });
};

const handleCreate = (table) => (req, res) => {
  const data = req.body;
  // Always stamp creation date
  if (!data.createdAt) {
    data.createdAt = new Date().toISOString();
  }
  const keys = Object.keys(data);
  const values = Object.values(data).map(v => {
    if (typeof v === 'object' && v !== null) return JSON.stringify(v);
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v;
  });
  const placeholders = keys.map(() => '?').join(',');
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, ...data });
  });
};

const handleUpdate = (table) => (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const updates = Object.keys(data).map(key => `${key} = ?`).join(',');
  const values = Object.values(data).map(v => {
    if (typeof v === 'object' && v !== null) return JSON.stringify(v);
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v;
  });

  const sql = `UPDATE ${table} SET ${updates} WHERE id = ?`;
  db.run(sql, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Updated', changes: this.changes });
  });
};

const handleDelete = (table) => (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM ${table} WHERE id = ?`, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted', changes: this.changes });
  });
};

// Companies
app.get('/api/companies', handleGet('companies'));
app.post('/api/companies', handleCreate('companies'));
app.put('/api/companies/:id', handleUpdate('companies'));
app.delete('/api/companies/:id', handleDelete('companies'));

// People
app.get('/api/people', handleGet('people'));
app.post('/api/people', handleCreate('people'));
app.put('/api/people/:id', handleUpdate('people'));
app.delete('/api/people/:id', handleDelete('people'));

// Tasks
app.get('/api/tasks', handleGet('tasks'));
app.post('/api/tasks', handleCreate('tasks'));
app.put('/api/tasks/:id', handleUpdate('tasks'));
app.delete('/api/tasks/:id', handleDelete('tasks'));

// Deals
app.get('/api/deals', handleGet('deals'));
app.post('/api/deals', handleCreate('deals'));
app.put('/api/deals/:id', handleUpdate('deals'));
app.delete('/api/deals/:id', handleDelete('deals'));

// --- NEW FLEXIBLE SCHEMA ENDPOINTS ---

// Objects: Get all database types
app.get('/api/objects', (req, res) => {
  db.all('SELECT * FROM objects ORDER BY is_system DESC, name ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => ({
      ...row,
      isSystem: !!row.is_system
    })));
  });
});

// Objects: Create new database type
// Objects: Create new database type
app.post('/api/objects', (req, res) => {
  const { id, name, slug, icon } = req.body;
  const objId = id || `obj_${slug}`;
  // Enforce slug as table name - basic sanitization
  const tableName = slug.replace(/[^a-z0-9_]/g, '');

  db.serialize(() => {
    db.run(
      'INSERT INTO objects (id, name, slug, icon, is_system, created_at) VALUES (?,?,?,?,0,?)',
      [objId, name, slug, icon || 'Database', new Date().toISOString()],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
      }
    );

    // Create the physical table to store records
    db.run(
      `CREATE TABLE IF NOT EXISTS ${tableName} (
        id TEXT PRIMARY KEY,
        createdAt TEXT DEFAULT (datetime('now'))
      )`,
      (err) => {
        if (err) {
          // Rollback object creation if table creation fails? 
          // For now just error out
          console.error("Failed to create table", err);
          return res.status(500).json({ error: "Failed to create table: " + err.message });
        }
        res.json({ id: objId, name, slug, icon, isSystem: false });
      }
    );
  });
});

// Attributes: Get all attributes for an object
app.get('/api/objects/:objectId/attributes', (req, res) => {
  const { objectId } = req.params;
  db.all(
    'SELECT * FROM attributes WHERE object_id = ? ORDER BY position ASC',
    [objectId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(row => ({
        id: row.id,
        objectId: row.object_id,
        name: row.name,
        type: row.type,
        config: row.config ? JSON.parse(row.config) : {},
        isSystem: !!row.is_system,
        position: row.position,
        createdAt: row.created_at
      })));
    }
  );
});

// Attributes: Create new attribute for an object
// Attributes: Create new attribute for an object
app.post('/api/objects/:objectId/attributes', (req, res) => {
  const { objectId } = req.params;
  const { id, name, type, config } = req.body;

  // Generate ID if not provided
  const attrId = id || `attr_${Date.now()}`;

  // Get max position and SLUG (table name)
  db.get('SELECT slug FROM objects WHERE id = ?', [objectId], (err, objRow) => {
    if (err || !objRow) return res.status(404).json({ error: 'Object not found' });
    const tableName = objRow.slug;

    db.get('SELECT MAX(position) as maxPos FROM attributes WHERE object_id = ?', [objectId], (err, row) => {
      const nextPosition = (row?.maxPos || 0) + 1;

      db.serialize(() => {
        db.run(
          'INSERT INTO attributes (id, object_id, name, type, config, position, created_at) VALUES (?,?,?,?,?,?,?)',
          [attrId, objectId, name, type, JSON.stringify(config || {}), nextPosition, new Date().toISOString()],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
          }
        );

        // Physically add column to table if it's not a computed/virtual type
        // Note: SQLite ALTER TABLE ADD COLUMN is limited, but works for basic types.
        // map type to sqlite type
        let sqliteType = 'TEXT'; // Default to TEXT for flexibility (JSON, Strings)
        if (type === 'number' || type === 'currency') sqliteType = 'NUMERIC';
        if (type === 'checkbox') sqliteType = 'INTEGER';

        // Check if column exists first? SQLite allows ADD COLUMN IF NOT EXISTS in newer versions, but plain ADD COLUMN fails if exists.
        // We'll rely on attrId uniqueness usually implying new col, but 'name' is NOT the column name. 
        // We DO NOT want to use 'name' (label) as column name. 
        // We need a stable accessor key.
        // Current system: 'companies' table has 'name', 'domain'.
        // Attributes map: 'attr_comp_name' -> name 'Company Name'.
        // The attribute 'name' in DB is the LABEL. 
        // The mapping to physical column is implied? 
        // Wait. In `attributeToColumn` helper: `accessorKey: attr.id`.
        // So the column name in the table MUST BE `attr.id`.
        // Example: column `attr_17823...` in table `projects`.

        // EXCEPT for system columns which have nice names (name, domain).
        // For custom attributes, we will use the attribute ID as the physical column name.

        const colName = attrId;

        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${sqliteType}`, (err) => {
          if (err) {
            // Startups often ignore errors here if column exists, but ideally we handle it.
            console.warn(`Failed to alter table ${tableName}`, err.message);
            // We don't fail the request because the metadata entry was created.
          }
          res.json({ id: attrId, objectId, name, type, config: config || {}, position: nextPosition });
        });
      });
    });
  });
});

// Attributes: Update attribute
app.put('/api/attributes/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, config, position } = req.body;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (type !== undefined) { updates.push('type = ?'); values.push(type); }
  if (config !== undefined) { updates.push('config = ?'); values.push(JSON.stringify(config)); }
  if (position !== undefined) { updates.push('position = ?'); values.push(position); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);

  db.run(
    `UPDATE attributes SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Updated', changes: this.changes });
    }
  );
});

// Attributes: Delete attribute (only non-system)
app.delete('/api/attributes/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM attributes WHERE id = ? AND is_system = 0', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted', changes: this.changes });
  });
});

// Relations: Link two records
app.post('/api/relations', (req, res) => {
  const { sourceRecordId, targetRecordId, attributeId } = req.body;
  const relationId = `rel_${Date.now()}`;

  db.run(
    'INSERT INTO record_relations (id, source_record_id, target_record_id, attribute_id, created_at) VALUES (?,?,?,?,?)',
    [relationId, sourceRecordId, targetRecordId, attributeId, new Date().toISOString()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: relationId, sourceRecordId, targetRecordId, attributeId });
    }
  );
});

// Relations: Get all relations for a record and attribute
app.get('/api/relations/:sourceRecordId/:attributeId', (req, res) => {
  const { sourceRecordId, attributeId } = req.params;

  db.all(
    'SELECT * FROM record_relations WHERE source_record_id = ? AND attribute_id = ?',
    [sourceRecordId, attributeId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Relations: Unlink records
app.delete('/api/relations/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM record_relations WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted', changes: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
