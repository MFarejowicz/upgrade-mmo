const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.get("/gold", async (req, res) => {
  let user = await User.findById(req.user._id);
  res.send({ gold: user.gold });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
