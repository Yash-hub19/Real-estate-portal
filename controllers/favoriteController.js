const User = require("../models/User");
const Property = require("../models/Property");

exports.getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: "favorites",
            populate: { path: "owner", select: "name email phone" }
        });
        res.json(user.favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addFavorite = async (req, res) => {
    try {
        const { propertyId } = req.params;

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        const user = await User.findById(req.user._id);
        if (!user.favorites.includes(propertyId)) {
            user.favorites.push(propertyId);
            await user.save();
        }

        res.json({ message: "Added to favorites", favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.removeFavorite = async (req, res) => {
    try {
        const { propertyId } = req.params;

        const user = await User.findById(req.user._id);
        user.favorites = user.favorites.filter((id) => id.toString() !== propertyId);
        await user.save();

        res.json({ message: "Removed from favorites", favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
