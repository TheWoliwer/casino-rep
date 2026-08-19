import mysql from 'mysql2/promise';

const dbHost = (process.env.MYSQL_HOST && !process.env.MYSQL_HOST.includes('hstgr.io')) 
  ? process.env.MYSQL_HOST 
  : '145.223.106.65';

const pool = mysql.createPool({
  host: dbHost,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'u664375310_casinotakip',
  password: process.env.MYSQL_PASSWORD || 'Dogukan123,.',
  database: process.env.MYSQL_DATABASE || 'u664375310_casinotakip',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
  decimalNumbers: true,
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: any[] = []): Promise<any> {
  const [result] = await pool.execute(sql, params);
  return result;
}

export default pool;
