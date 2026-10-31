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

pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("Database Connection Failed:", err);
        process.exit(1);
    }

    console.log("Database Connected:", result.rows[0]);

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server Running on Port ${PORT}`);

        // Run SLA check immediately.
        checkSlaBreaches();

        // Run SLA check every 60 seconds.
        setInterval(checkSlaBreaches, 60 * 1000);

        console.log("SLA Monitor Started");
    });
});
