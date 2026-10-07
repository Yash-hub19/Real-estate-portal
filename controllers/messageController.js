const Message = require("../models/Message");
const Property = require("../models/Property");

exports.sendMessage = async (req, res) => {
    try {
        const { propertyId, subject, message } = req.body;

        if (!propertyId || !message) {
            return res.status(400).json({ message: "propertyId and message are required" });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        const newMessage = await Message.create({
            sender: req.user._id,
            receiver: property.owner,
            property: property._id,
            subject: subject || `Inquiry about ${property.title}`,
            message
        });

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ receiver: req.user._id })
            .populate("sender", "name email phone")
            .populate("property", "title")
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        const message = await Message.findOne({
            _id: req.params.id,
            receiver: req.user._id
        });

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        message.read = true;
        await message.save();
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
