import express from "express";
import conn from "./db.js";
import dotenv from "dotenv";
import route from "./route.js"
import corsOptions from "./helpers/corsOptions.js";
import cors from "cors"
import MethodOverride from "method-override";
import { Server } from "socket.io";

const app = express();
dotenv.config();
conn();

//ejs template engine 
app.use(express.static("public"))


//static files middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}))

app.use(cors(corsOptions))
route(app);

const server = app.listen(process.env.PORT, () => {
  console.log("Baglandı");
});
// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:8800"],
//   }
// });
// io.on('connection', (socket) => {
//   console.log("on connection", socket.id);


//   socket.on('disconnect', () => {
//     console.log("disconnected");
//   });

//   socket.on('chatUser', (data) => {
//     console.log("chatUser", data);
//     socket.broadcast.emit("chat", {
//       message: data,
//     })
//   });




// });