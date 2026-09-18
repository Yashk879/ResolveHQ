const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected to socket:", socket.id);

    // Auto-join company room if companyId passed in handshake query
    const queryCompanyId = socket.handshake.query?.companyId;
    if (queryCompanyId) {
      const room = `company_${queryCompanyId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room} via query`);
    }

    // Try extracting and verifying token from cookie
    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader && process.env.JWT_SECRET) {
      const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) {
        try {
          const decoded = jwt.verify(match[1], process.env.JWT_SECRET);
          if (decoded && decoded.companyId) {
            socket.join(`company_${decoded.companyId}`);
            console.log(`Socket ${socket.id} joined room company_${decoded.companyId} via cookie`);
          }
        } catch (e) {
          // Token expired or invalid, ignore
        }
      }
    }

    // Allow client to explicitly join company room
    socket.on("join:company", (companyId) => {
      if (companyId) {
        const room = `company_${companyId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room} via event`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from socket:", socket.id);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitTicketEvent(companyId, event, data) {
  if (!io) return;
  if (companyId) {
    io.to(`company_${companyId}`).emit(event, data);
  } else {
    io.emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitTicketEvent,
};
