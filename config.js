

const SECRET_KEY = process.env.SECRET_KEY || 'secret-dev';

const PORT = process.env.PORT || 3001;



// Use dev database, testing database, or via env var, production database
function getDatabaseUri() {
    return (process.env.NODE_ENV === "test")
        ? "postgresql://flight:tracker@localhost/flight_tracker_test"
        : process.env.DATABASE_URL || "postgresql://postgres.eqzqckkcmkdwqcferswp:F43sNnUyjfXKvjhs@aws-0-us-west-1.pooler.supabase.com:6543/postgres";
  }

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === 'test' ? 1 : 12;

module.exports = { 
    SECRET_KEY,
    BCRYPT_WORK_FACTOR,
    PORT,
    getDatabaseUri
};