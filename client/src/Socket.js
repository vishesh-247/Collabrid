import { io } from "socket.io-client";

export const initSocket = async (token) => {
  const options = {
    auth: { token },
    forceNew: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ["websocket"],
  };

  return io(process.env.REACT_APP_BACKEND_URL || "http://localhost:5000", options);
};