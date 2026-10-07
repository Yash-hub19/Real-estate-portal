const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
    getProperties,
    getProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    getMyProperties
} = require("../controllers/propertyController");

router.get("/", getProperties);
router.get("/mine", auth, getMyProperties);
router.get("/:id", getProperty);
router.post("/", auth, upload.array("images", 8), createProperty);
router.put("/:id", auth, upload.array("images", 8), updateProperty);
router.delete("/:id", auth, deleteProperty);

module.exports = router;
