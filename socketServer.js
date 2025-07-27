import { Server } from "socket.io";

const io = null;

export function getServer() {
    console.log("getServer");
    console.log({io});
    return io;
}

export function initializeSocketServer(httpServer) {
  if (!io) {
    io = new Server(httpServer);
    io.on("connection", (socket) => {
      console.log('Socket.io: a user connected');
      io.emit("hello", "world");
      socket.on("orderCreated", (order) => {
        console.log("orderCreated: ", order);
        io.emit("orderCreated", order);
      });
      socket.on("newOrderCreated", (order) => {
        console.log("newOrderCreated: ", order);
        io.emit("newOrderCreated", order);
      });
      socket.on('disconnect', () => {
        console.log('Socket.io: user disconnected');
      });
    });
  }
  return io;
}