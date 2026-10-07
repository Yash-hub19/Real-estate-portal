const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
    getDashboard,
    getUsers,
    deleteUser,
    getAllProperties
} = require("../controllers/adminController");

router.use(auth, admin);

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.get("/properties", getAllProperties);

module.exports = router;
