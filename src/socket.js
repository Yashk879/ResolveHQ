
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

function parseCookies(cookieHeader = "") {
  const cookies = {};

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) continue;

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }

  return cookies;
}

function authenticateSocket(socket, next) {
  try {
    if (!process.env.JWT_SECRET) {
      return next(new Error("Socket authentication is not configured"));
    }

    const cookies = parseCookies(socket.handshake.headers.cookie);

    // Determine the session type from the cookie used.
    const isAgent = Boolean(cookies.token);
    const token = isAgent ? cookies.token : cookies.customer_token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.companyId) {
      return next(new Error("Invalid authentication token"));
    }

    if (isAgent) {
      if (!decoded.agentId || !decoded.role) {
        return next(new Error("Invalid agent session"));
      }

      socket.data.user = {
        type: "agent",
        agentId: String(decoded.agentId),
        companyId: String(decoded.companyId),
        role: decoded.role,
      };
    } else {
      if (
        decoded.type !== "customer" ||
        !decoded.customerId
      ) {
        return next(new Error("Invalid customer session"));
      }

      socket.data.user = {
        type: "customer",
        customerId: String(decoded.customerId),
        companyId: String(decoded.companyId),
      };
    }

    return next();
  } catch {
    return next(new Error("Invalid or expired authentication token"));
  }
}

function initSocket(server) {
  const frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:5173";

  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        frontendUrl,
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const user = socket.data.user;

    console.log(
      `Authenticated ${user.type} socket connected:`,
      socket.id
    );

    // Only agents may join company-wide ticket and message events.
    if (user.type === "agent") {
      socket.join(`company_${user.companyId}`);
    }

    socket.on("join:company", () => {
      // Never let a customer join a company-wide event room.
      if (user.type !== "agent") return;

      socket.join(`company_${user.companyId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitTicketEvent(companyId, event, data) {
  if (!io || !companyId) return;

  // Company-wide events are received only by authenticated agents.
  io.to(`company_${companyId}`).emit(event, data);
}

module.exports = {
  initSocket,
  getIO,
  emitTicketEvent,
};
