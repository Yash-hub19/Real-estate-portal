const User = require("../models/User");
const Property = require("../models/Property");
const Message = require("../models/Message");

exports.getDashboard = async (req, res) => {
    try {
        const [userCount, propertyCount, messageCount, forSale, forRent] = await Promise.all([
            User.countDocuments(),
            Property.countDocuments(),
            Message.countDocuments(),
            Property.countDocuments({ status: "For Sale" }),
            Property.countDocuments({ status: "For Rent" })
        ]);

        const recentProperties = await Property.find()
            .populate("owner", "name email")
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            stats: { userCount, propertyCount, messageCount, forSale, forRent },
            recentProperties
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot delete your own account here" });
        }

        await user.deleteOne();
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllProperties = async (req, res) => {
    try {
        const properties = await Property.find()
            .populate("owner", "name email")
            .sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
