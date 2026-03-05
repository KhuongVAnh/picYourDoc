import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

// Tạo socket client có kèm JWT token để kết nối vào kênh tư vấn realtime.
function createConsultSocket(accessToken) {
  return io(API_BASE_URL, {
    auth: {
      token: accessToken,
    },
    transports: ["websocket"],
    autoConnect: true,
  });
}

export { createConsultSocket };
