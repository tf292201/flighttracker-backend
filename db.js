


const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    connectionString: getDatabaseUri()
  });
}

db.connect();


//////////////////////test////////////////////////
async function testDatabaseConnection() {
  try {
    // Execute a simple query to test the connection
    const result = await db.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

// Call the function to test the database connection
testDatabaseConnection();

module.exports = db;