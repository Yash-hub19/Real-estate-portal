const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
    getFavorites,
    addFavorite,
    removeFavorite
} = require("../controllers/favoriteController");

router.get("/", auth, getFavorites);
router.post("/:propertyId", auth, addFavorite);
router.delete("/:propertyId", auth, removeFavorite);

module.exports = router;
