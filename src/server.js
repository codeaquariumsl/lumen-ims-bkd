const app = require('./app');
const pool = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

// Test DB Connection
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database connection established successfully.');
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
