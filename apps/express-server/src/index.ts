if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: "../../.env" });
}

import express from "express";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const cookie = require("cookie");
const prisma: PrismaClient = new PrismaClient();
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.use(async (socket, next) => {
  try {
    const req: any = {
      cookies: cookie.parse(socket.request.headers.cookie),
    };
    const token: any = await getToken({ req });
    if (!token) throw new Error("No token found");

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: token.sub },
    });

    if (!user) throw new Error("User not found");
    if (user.salt) {
      for (let i = 0; i < user.salt.length; i++) {
        if (user.salt[i] !== token.user.salt.data[i]) {
          throw new Error("Incorrect salt");
        }
      }
    }

    socket.user = user;

    next();
  } catch (err) {
    console.error(err);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("socket.user", socket.user);
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
});

server.listen(8888, () => {
  console.log("listening on *:8888");
});
