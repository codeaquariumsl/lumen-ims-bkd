const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function initializeDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'optical_mis';

  console.log(`Connecting to MySQL server at ${host}:${port} as ${user}...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.query(`USE \`${database}\`;`);

    console.log(`Database "${database}" initialized or verified.`);

    // Read and execute db-schema.sql
    const schemaPath = path.join(__dirname, '../../db-schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Reading db-schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      await connection.query(schemaSql);
      console.log('Database schema applied successfully.');
    } else {
      console.warn('Warning: db-schema.sql not found. Skipping table creation.');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

async function seedData() {
  const pool = require('../config/database');

  console.log('Seeding initial data...');
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Seed Branch if none exists
    const [branches] = await conn.query('SELECT * FROM branches LIMIT 1');
    let branchId;
    if (branches.length === 0) {
      const [res] = await conn.query(
        `INSERT INTO branches (name, code, address, city, state, pincode, phone, email) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Lumen Opticals Colombo', 'COLOMBO-01', '123 Galle Road', 'Colombo', 'Western', '00300', '0112345678', 'colombo@lumenopticals.com']
      );
      branchId = res.insertId;
      console.log('Seeded default branch with ID:', branchId);
    } else {
      branchId = branches[0].id;
      console.log('Default branch already exists:', branches[0].name);
    }

    // 2. Seed Admin User if none exists
    const [users] = await conn.query('SELECT * FROM users WHERE email = ?', ['admin@optical.com']);
    let adminId;
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      const [res] = await conn.query(
        `INSERT INTO users (name, email, password, role, branch_id, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['System Admin', 'admin@optical.com', hashedPassword, 'admin', branchId, 1]
      );
      adminId = res.insertId;
      console.log('Seeded default admin user (admin@optical.com / demo123) with ID:', adminId);
    } else {
      adminId = users[0].id;
      console.log('Admin user already exists.');
    }

    // 3. Seed Optometrist User
    const [optos] = await conn.query('SELECT * FROM users WHERE email = ?', ['optom@optical.com']);
    let optometristId;
    if (optos.length === 0) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      const [res] = await conn.query(
        `INSERT INTO users (name, email, password, role, branch_id, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Dr. Sarah Perera', 'optom@optical.com', hashedPassword, 'optometrist', branchId, 1]
      );
      optometristId = res.insertId;
      console.log('Seeded default optometrist user (optom@optical.com / demo123) with ID:', optometristId);
    } else {
      optometristId = optos[0].id;
      console.log('Optometrist user already exists.');
    }

    // 4. Seed Customers
    const [customers] = await conn.query('SELECT * FROM customers LIMIT 1');
    let custId1, custId2;
    if (customers.length === 0) {
      const [res1] = await conn.query(
        `INSERT INTO customers (branch_id, first_name, last_name, phone, email, date_of_birth, gender, city, customer_type, total_spent) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [branchId, 'Raj', 'Kumar', '9876543210', 'raj@email.com', '1992-03-15', 'male', 'Mumbai', 'regular', 15000.00]
      );
      custId1 = res1.insertId;

      const [res2] = await conn.query(
        `INSERT INTO customers (branch_id, first_name, last_name, phone, email, date_of_birth, gender, city, customer_type, total_spent) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [branchId, 'Priya', 'Singh', '9876543211', 'priya@email.com', '1998-07-22', 'female', 'Delhi', 'vip', 8500.00]
      );
      custId2 = res2.insertId;
      console.log('Seeded default customers.');
    } else {
      console.log('Customers already exist.');
    }

    // 5. Seed Products & Inventory
    const [products] = await conn.query('SELECT * FROM products LIMIT 1');
    if (products.length === 0) {
      const productsData = [
        { code: 'FR-001', name: 'Classic Brown Frames', category: 'frames', subcategory: 'unisex', costPrice: 1500, sellingPrice: 2500, quantity: 15 },
        { code: 'LN-001', name: 'Power Lens SPH +1.00', category: 'lenses', subcategory: 'single-vision', costPrice: 800, sellingPrice: 1800, quantity: 3 },
        { code: 'AC-001', name: 'Anti-Glare Coating', category: 'services', subcategory: 'lens-treatment', costPrice: 200, sellingPrice: 500, quantity: 50 },
        { code: 'ACC-001', name: 'Cleaning Cloth Pack', category: 'accessories', subcategory: 'wipes', costPrice: 100, sellingPrice: 250, quantity: 2 },
        { code: 'SUN-001', name: 'Branded Sunglasses', category: 'frames', subcategory: 'mens', costPrice: 2000, sellingPrice: 3500, quantity: 10 },
        { code: 'LN-002', name: 'Progressive Lens', category: 'lenses', subcategory: 'progressive', costPrice: 1600, sellingPrice: 3200, quantity: 8 }
      ];

      for (const prod of productsData) {
        const [res] = await conn.query(
          `INSERT INTO products (branch_id, code, name, category, subcategory, cost_price, selling_price, min_stock, max_stock) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [branchId, prod.code, prod.name, prod.category, prod.subcategory, prod.costPrice, prod.sellingPrice, 5, 100]
        );
        const prodId = res.insertId;
        
        await conn.query(
          `INSERT INTO inventory (branch_id, product_id, quantity) 
           VALUES (?, ?, ?)`,
          [branchId, prodId, prod.quantity]
        );
      }
      console.log('Seeded default products and inventory.');
    } else {
      console.log('Products already exist.');
    }

    await conn.commit();
    console.log('Database seeding completed successfully.');
  } catch (error) {
    await conn.rollback();
    console.error('Error seeding data:', error);
  } finally {
    conn.release();
    pool.end();
  }
}

async function run() {
  await initializeDatabase();
  await seedData();
}

run();
