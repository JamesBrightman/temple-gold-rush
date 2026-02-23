const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handler(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*"
    }
  });

  global.__templeIo = io;

  io.on("connection", (socket) => {
    socket.on("room:subscribe", (payload) => {
      const roomId =
        typeof payload?.roomId === "string"
          ? payload.roomId.trim().toUpperCase()
          : "";

      if (!roomId) {
        return;
      }

      socket.join(`room:${roomId}`);
      socket.emit("room:subscribed", { roomId });
    });

    socket.on("room:unsubscribe", (payload) => {
      const roomId =
        typeof payload?.roomId === "string"
          ? payload.roomId.trim().toUpperCase()
          : "";

      if (!roomId) {
        return;
      }

      socket.leave(`room:${roomId}`);
    });
  });

  httpServer
    .once("error", (error) => {
      console.error(error);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
