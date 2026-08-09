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

    // Auto-migrate categories table if missing
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      const [catRows] = await connection.query(`SELECT COUNT(*) as count FROM categories`);
      if (catRows[0].count === 0) {
        const defaultCats = ['frames', 'lenses', 'services', 'accessories', 'contact-lens'];
        for (const cat of defaultCats) {
          await connection.query(`INSERT IGNORE INTO categories (name) VALUES (?)`, [cat]);
        }
        console.log('Seeded default categories into database.');
      }
    } catch (catMigErr) {
      console.warn('Auto migration for categories skipped/handled:', catMigErr.message);
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
