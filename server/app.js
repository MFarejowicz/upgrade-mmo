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

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
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

http.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
