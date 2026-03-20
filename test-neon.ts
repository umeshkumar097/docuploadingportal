import { Pool } from '@neondatabase/serverless';

const url = "postgresql://neondb_owner:npg_rKh8zv0weNaU@ep-purple-recipe-a5i0hocr.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  console.log("Testing Pool with url:", url);
  try {
    const pool = new Pool({ connectionString: url });
    console.log("Pool instantiated. Connecting...");
    const client = await pool.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
    client.release();
    await pool.end();
  } catch (err) {
    console.error("Connection Failed:", err);
  }
}

main();
