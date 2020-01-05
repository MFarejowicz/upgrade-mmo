require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("./passport");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io").listen(http);

const api = require("./routes/api");

const players = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGO_CONNECTION_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(
    () => console.log("Connected to MongoDB"),
    (err) => console.log("Error connecting to MongoDB: " + err)
  );

app.use(
  session({
    secret: "session-secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", api);

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: true }),
  (_req, res) => {
    res.redirect("/game");
  }
);

app.get("/auth/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.use(express.static(path.resolve(__dirname, "..", "client")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client", "index.html"));
});

app.get("/game", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client", "game.html"));
});

app.get("/api/gold", (req, res) => {
  const user = req.user;
  console.log(user);
});

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  // create a new player and add it to our players object
  players[socket.id] = {
    playerId: socket.id,
    x: Math.floor(Math.random() * 256) - 128,
    y: Math.floor(Math.random() * 256) - 128,
  };

  // send the players object to the new player
  socket.emit("currentPlayers", players);

  // update all other players of the new player
  socket.broadcast.emit("newPlayer", players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on("disconnect", function() {
    console.log("User disconnected: ", socket.id);
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit("disconnect", socket.id);
  });

  // when a player moves, update the player data
  socket.on("playerMovement", function(movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    // emit a message to all players about the player that moved
    socket.broadcast.emit("playerMoved", players[socket.id]);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
