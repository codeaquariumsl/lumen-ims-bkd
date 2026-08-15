const app = require('./app');
const pool = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

// Test DB Connection & Run Auto Migrations
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database connection established successfully.');
    
    // Auto-migrate prescription_number column if missing
    try {
      const [cols] = await connection.query(`SHOW COLUMNS FROM prescriptions LIKE 'prescription_number'`);
      if (cols.length === 0) {
        await connection.query(`ALTER TABLE prescriptions ADD COLUMN prescription_number VARCHAR(50) NULL UNIQUE AFTER id`);
        console.log('Successfully added prescription_number column to prescriptions table.');
      }
    } catch (migErr) {
      console.warn('Auto migration for prescription_number skipped/handled:', migErr.message);
    }

    // Auto-migrate categories table and code column
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          code VARCHAR(10) NULL,
          description TEXT NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      const [codeCols] = await connection.query(`SHOW COLUMNS FROM categories LIKE 'code'`);
      if (codeCols.length === 0) {
        await connection.query(`ALTER TABLE categories ADD COLUMN code VARCHAR(10) NULL AFTER name`);
        console.log('Added code column to categories table.');
      }

      const defaultCodeMap = {
        'frames': 'FR',
        'lenses': 'LN',
        'services': 'SV',
        'accessories': 'AC',
        'contact-lens': 'CL'
      };

      const [catRows] = await connection.query(`SELECT id, name, code FROM categories`);
      if (catRows.length === 0) {
        for (const [name, code] of Object.entries(defaultCodeMap)) {
          await connection.query(`INSERT IGNORE INTO categories (name, code) VALUES (?, ?)`, [name, code]);
        }
        console.log('Seeded default categories into database with 2-letter codes.');
      } else {
        for (const cat of catRows) {
          if (!cat.code) {
            const defaultCode = defaultCodeMap[cat.name.toLowerCase()] || cat.name.substring(0, 2).toUpperCase();
            await connection.query(`UPDATE categories SET code = ? WHERE id = ?`, [defaultCode, cat.id]);
          }
        }
      }
    } catch (catMigErr) {
      console.warn('Auto migration for categories skipped/handled:', catMigErr.message);
    }

    // Auto-migrate products table type column
    try {
      const [typeCols] = await connection.query(`SHOW COLUMNS FROM products LIKE 'type'`);
      if (typeCols.length === 0) {
        await connection.query(`ALTER TABLE products ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'inventory' AFTER category`);
        console.log('Added type column to products table.');
      }
    } catch (prodMigErr) {
      console.warn('Auto migration for products type column skipped/handled:', prodMigErr.message);
    }

    connection.release();
  } catch (error) {
    console.error('MySQL Database connection FAILED:', error.message);
    console.error('Please ensure MySQL server is running and database configuration in .env is correct.');
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  await testDbConnection();
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down server...');
  console.error(err.name, err.message);
  if (err.stack) console.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});
