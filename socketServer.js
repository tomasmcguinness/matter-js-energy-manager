import { Server } from "socket.io";

export function getSocketServer() {
    return globalThis.io;
}

export function initializeSocketServer(httpServer) {
  
  console.log('initializeSocketServer()');

  if (!globalThis.io) {
    
    globalThis.io = new Server(httpServer);
    globalThis.io.on("connection", (socket) => {
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

  return globalThis.io;
}