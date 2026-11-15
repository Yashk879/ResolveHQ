
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");

const ticketRoute = require("./routes/ticketRoutes");
const authroutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const messageRoutes = require("./routes/messages.routes");
const agentsRouter = require("./routes/agents.routes");
const statsRouter = require("./routes/stats.routes");
const companyRoutes = require("./routes/company.routes");
const customerAuthRoutes = require("./routes/customerAuth.routes");
const customerPortalRoutes = require("./routes/customerPortal.routes");
const contactMailRoutes = require("./routes/contactMail.routes");
const faqRoutes = require("./routes/faq.routes");

const app = express();

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://resolve-hq-one.vercel.app",
  process.env.FRONTEND_URL?.trim().replace(/\/+$/, ""),
].filter(Boolean);

// CORS Configuration
app.use(
  cors({
    origin(origin, callback) {
      console.log("CORS incoming origin:", origin);

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked origin:", origin);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

// Handle preflight requests
app.options(/.*/, cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    await require("./db/pool").query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "ResolveHQ backend is healthy",
      database: "Connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health Check Failed:", error);

    res.status(503).json({
      success: false,
      message: "ResolveHQ backend is running but database is unavailable",
      database: "Disconnected",
    });
  }
});

// API Routes
app.use("/api/auth", authroutes);
app.use("/api/tickets", ticketRoute);
app.use("/api/customer", customerRoutes);
app.use("/api/response", messageRoutes);
app.use("/api/agents", agentsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/companies", companyRoutes);
app.use("/api/customer-auth", customerAuthRoutes);
app.use("/api/customer-portal", customerPortalRoutes);
app.use("/api/contact", contactMailRoutes);
app.use("/api/faqs", faqRoutes);

module.exports = app;
