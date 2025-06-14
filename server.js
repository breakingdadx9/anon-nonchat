const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const moment = require("moment");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(__dirname + "/public"));
app.use('/uploads', express.static('uploads'));

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Image upload endpoint
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");
  const imageUrl = `/uploads/${req.file.filename}`;
  res.send({ imageUrl });
});

// Handle socket connections
io.on("connection", socket => {
  const ip = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;
  const shortIp = ip.split(",")[0].trim();

  socket.on("message", msg => {
    const timestamp = moment().format("hh:mm A");
    const data = { msg, ip: shortIp, time: timestamp };
    io.emit("message", data);
  });

  socket.on("image", imgUrl => {
    const timestamp = moment().format("hh:mm A");
    const data = { img: imgUrl, ip: shortIp, time: timestamp };
    io.emit("message", data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
