import { Pool, types } from 'pg';

// Timestamps live in `timestamp without time zone` columns holding UTC (the
// DB runs on GMT and the app writes ISO strings). pg would otherwise read them
// as server-local time, shifting every event by the host's offset (5h30 in IST).
types.setTypeParser(types.builtins.TIMESTAMP, (v) => new Date(v.replace(' ', 'T') + 'Z'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Database Query Error:', err, text, params);
    throw err;
  }
};

const getClient = async () => {
  const client = await pool.connect();
  return client;
};

const db = { query, getClient };
export default db;
