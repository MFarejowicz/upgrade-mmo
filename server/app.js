require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require("path");

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

app.use(express.static(path.resolve(__dirname, "..", "client")));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "../client", "index.html"));
});

http.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
