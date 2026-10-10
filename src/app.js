
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

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as server-to-server calls.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

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

module.exports = app;