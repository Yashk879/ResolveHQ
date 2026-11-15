
const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,

    // Enable SSL for the hosted Neon database.
    ssl: isProduction
        ? { rejectUnauthorized: false }
        : false,

    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
});

pool.on("connect", () => {
    console.log("PostgreSQL connection established");
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err);
});

module.exports = pool;
