// Import Pool and PoolConfig types from pg.
// Pool manages reusable PostgreSQL connections.
// PoolConfig describes the settings accepted by Pool.
import { Pool, type PoolConfig } from "pg";

// Check that all required database settings are present.
const requiredSettings = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD"
] as const;

for (const setting of requiredSettings) {
    if (!process.env[setting]) {
        throw new Error(
            `Missing required database setting: ${setting}`
        );
    }
}

// Build a typed configuration object.
const databaseConfig: PoolConfig = {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
};

// Create the shared PostgreSQL connection pool.
const pool = new Pool(databaseConfig);

// Log unexpected errors without exposing connection details.
pool.on("error", (error: Error) => {
    console.error("Unexpected PostgreSQL pool error:", error.message);
});

// Export the pool for use by repositories and services.
export default pool;
