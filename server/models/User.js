const mongoose = require("mongoose");

// Define the user schema
const UserSchema = new mongoose.Schema({
  name: String,
  google_id: String,
});

// Compile model from schema
module.exports = mongoose.model("User", UserSchema);
