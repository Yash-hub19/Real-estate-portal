const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { sendMessage, getMessages, markRead } = require("../controllers/messageController");

router.post("/", auth, sendMessage);
router.get("/", auth, getMessages);
router.put("/:id/read", auth, markRead);

module.exports = router;
