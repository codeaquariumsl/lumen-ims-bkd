const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function migrate() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'optical_mis';

  const connection = await mysql.createConnection({
    host, port, user, password, database
  });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`settings\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`setting_key\` VARCHAR(100) NOT NULL UNIQUE,
      \`setting_value\` TEXT,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Settings table created.');
  process.exit(0);
}

migrate().catch(console.error);
