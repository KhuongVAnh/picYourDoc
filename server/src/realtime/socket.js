const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const consultsService = require("../modules/consults/consults.service");

let ioInstance = null;

// Chuẩn hóa tên room theo từng consult session để gom sự kiện realtime.
function getSessionRoomName(sessionId) {
  return `consult:session:${sessionId}`;
}

// Chuẩn hóa tên room cá nhân để forward tín hiệu trực tiếp theo userId.
function getUserRoomName(userId) {
  return `user:${userId}`;
}

// Trả lỗi theo chuẩn ack và đồng thời emit event lỗi cho client.
function emitSocketError({ socket, ack, event, error }) {
  const payload = {
    ok: false,
    error: {
      event,
      message: error.message || "Socket error",
      statusCode: error.statusCode || 500,
    },
  };

  if (typeof ack === "function") {
    ack(payload);
  }

  socket.emit("consult:error", payload.error);
}

// Trả dữ liệu thành công cho callback ack nếu client có truyền vào.
function emitSocketSuccess(ack, data = {}) {
  if (typeof ack === "function") {
    ack({ ok: true, data });
  }
}

// Lấy token từ handshake auth hoặc header để xác thực socket.
function extractSocketToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken && typeof authToken === "string") {
    return authToken;
  }

  const authorization = socket.handshake.headers?.authorization;
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return null;
}

// Định tuyến sự kiện signaling WebRTC đến đúng user đích trong cùng session.
async function forwardSignalEvent({ socket, payload, ack, eventName, fieldName }) {
  try {
    const { sessionId, toUserId } = payload || {};
    await consultsService.ensureSignalRecipient({
      sessionId,
      user: socket.user,
      toUserId,
    });

    const outboundPayload = {
      sessionId,
      toUserId,
      fromUserId: socket.user.userId,
      [fieldName]: payload[fieldName],
      createdAt: new Date().toISOString(),
    };

    ioInstance.to(getUserRoomName(toUserId)).emit(eventName, outboundPayload);
    emitSocketSuccess(ack, outboundPayload);
  } catch (error) {
    emitSocketError({ socket, ack, event: eventName, error });
  }
}

// Gắn toàn bộ event handler realtime cho một socket đã xác thực.
function registerConsultSocketEvents(socket) {
  socket.on("consult:join", async (payload, ack) => {
    try {
      const { sessionId } = payload || {};
      await consultsService.ensureRealtimeSessionAccess({
        sessionId,
        user: socket.user,
      });

      const roomName = getSessionRoomName(sessionId);
      await socket.join(roomName);

      const joinedPayload = {
        sessionId,
        userId: socket.user.userId,
        role: socket.user.role,
        joinedAt: new Date().toISOString(),
      };

      socket.to(roomName).emit("consult:participant:joined", joinedPayload);
      emitSocketSuccess(ack, { sessionId, joinedAt: joinedPayload.joinedAt });
    } catch (error) {
      emitSocketError({ socket, ack, event: "consult:join", error });
    }
  });

  socket.on("consult:leave", async (payload, ack) => {
    try {
      const { sessionId } = payload || {};
      const roomName = getSessionRoomName(sessionId);
      await socket.leave(roomName);

      socket.to(roomName).emit("consult:participant:left", {
        sessionId,
        userId: socket.user.userId,
        role: socket.user.role,
        leftAt: new Date().toISOString(),
      });

      emitSocketSuccess(ack, { sessionId });
    } catch (error) {
      emitSocketError({ socket, ack, event: "consult:leave", error });
    }
  });

  socket.on("consult:message:send", async (payload, ack) => {
    try {
      const { sessionId, content, clientMessageId } = payload || {};

      const message = await consultsService.saveRealtimeMessage({
        sessionId,
        user: socket.user,
        content,
      });

      const outboundPayload = {
        ...message,
        clientMessageId: clientMessageId || null,
      };

      ioInstance.to(getSessionRoomName(sessionId)).emit("consult:message:new", outboundPayload);
      emitSocketSuccess(ack, outboundPayload);
    } catch (error) {
      emitSocketError({ socket, ack, event: "consult:message:send", error });
    }
  });

  socket.on("consult:signal:offer", async (payload, ack) => {
    await forwardSignalEvent({
      socket,
      payload,
      ack,
      eventName: "consult:signal:offer",
      fieldName: "sdp",
    });
  });

  socket.on("consult:signal:answer", async (payload, ack) => {
    await forwardSignalEvent({
      socket,
      payload,
      ack,
      eventName: "consult:signal:answer",
      fieldName: "sdp",
    });
  });

  socket.on("consult:signal:ice", async (payload, ack) => {
    await forwardSignalEvent({
      socket,
      payload,
      ack,
      eventName: "consult:signal:ice",
      fieldName: "candidate",
    });
  });

  socket.on("consult:call:end", async (payload, ack) => {
    try {
      const { sessionId } = payload || {};
      await consultsService.ensureRealtimeSessionAccess({
        sessionId,
        user: socket.user,
      });

      const outboundPayload = {
        sessionId,
        fromUserId: socket.user.userId,
        createdAt: new Date().toISOString(),
      };
      ioInstance.to(getSessionRoomName(sessionId)).emit("consult:call:end", outboundPayload);
      emitSocketSuccess(ack, outboundPayload);
    } catch (error) {
      emitSocketError({ socket, ack, event: "consult:call:end", error });
    }
  });

  socket.on("disconnecting", () => {
    // Broadcast rời phòng cho tất cả room consult mà socket đang tham gia.
    socket.rooms.forEach((roomName) => {
      if (!roomName.startsWith("consult:session:")) {
        return;
      }

      const sessionId = roomName.replace("consult:session:", "");
      socket.to(roomName).emit("consult:participant:left", {
        sessionId,
        userId: socket.user.userId,
        role: socket.user.role,
        leftAt: new Date().toISOString(),
      });
    });
  });
}

// Khởi tạo Socket.IO server và middleware xác thực JWT cho handshake.
function initializeSocketServer(httpServer) {
  if (ioInstance) {
    return ioInstance;
  }

  const allowedOrigins = env.clientOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  ioInstance = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length === 0 ? true : allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = extractSocketToken(socket);
      if (!token) {
        throw new Error("Missing socket token");
      }

      const payload = jwt.verify(token, env.jwtAccessSecret);
      socket.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      return next();
    } catch (error) {
      const authError = new Error("Unauthorized socket");
      authError.data = { statusCode: 401 };
      return next(authError);
    }
  });

  ioInstance.on("connection", (socket) => {
    // Join room cá nhân để server forward signaling theo toUserId.
    socket.join(getUserRoomName(socket.user.userId));
    registerConsultSocketEvents(socket);
  });

  return ioInstance;
}

// Truy cập instance hiện tại của Socket.IO khi cần emit từ HTTP controller.
function getSocketServer() {
  return ioInstance;
}

// Emit sự kiện phiên tư vấn đã kết thúc cho toàn bộ thành viên trong room.
function emitConsultSessionEnded(session) {
  if (!ioInstance || !session) {
    return;
  }

  ioInstance.to(getSessionRoomName(session.id)).emit("consult:session:ended", {
    sessionId: session.id,
    appointmentId: session.appointmentId,
    status: session.status,
    endedAt: session.endedAt ? new Date(session.endedAt).toISOString() : null,
  });
}

module.exports = {
  initializeSocketServer,
  getSocketServer,
  emitConsultSessionEnded,
};
