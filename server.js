require("dotenv").config();

const app = require("./src/app");
const http = require("http");
const { initSocket } = require("./src/socket");
const pool = require("./src/db/pool");
const { checkSlaBreaches } = require("./src/services/slaMonitor.service");

const server = http.createServer(app);
const io = initSocket(server);

app.set("io", io);

const PORT = process.env.PORT || 3000;

pool.query(
    `SELECT
    current_database() AS database_name,
    current_schema() AS schema_name,
    current_user AS database_user,
    current_setting('neon.branch_id', true) AS branch_id,
    (SELECT COUNT(*) FROM public.companies) AS company_count`,
    (err, result) => {
        if (err) {
            console.error("Database Connection Failed:", err);
            process.exit(1);
        }

        console.log("Database Diagnostic:", result.rows[0]);

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Server Running on Port ${PORT}`);

            checkSlaBreaches();
            setInterval(checkSlaBreaches, 60 * 1000);

            console.log("SLA Monitor Started");
        });
    }
);