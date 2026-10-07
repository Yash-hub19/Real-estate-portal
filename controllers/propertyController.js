const Property = require("../models/Property");

exports.getProperties = async (req, res) => {
    try {
        const {
            location,
            type,
            status,
            minPrice,
            maxPrice,
            bedrooms,
            bathrooms,
            q,
            sort,
            page = 1,
            limit = 12
        } = req.query;

        const filter = {};

        if (location) filter.location = { $regex: location, $options: "i" };
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (bedrooms) filter.bedrooms = { $gte: Number(bedrooms) };
        if (bathrooms) filter.bathrooms = { $gte: Number(bathrooms) };

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        if (q) {
            filter.$text = { $search: q };
        }

        let sortOption = { createdAt: -1 };
        if (sort === "price_asc") sortOption = { price: 1 };
        if (sort === "price_desc") sortOption = { price: -1 };
        if (sort === "newest") sortOption = { createdAt: -1 };

        const pageNum = Math.max(Number(page), 1);
        const limitNum = Math.min(Math.max(Number(limit), 1), 50);

        const [properties, total] = await Promise.all([
            Property.find(filter)
                .populate("owner", "name email phone")
                .sort(sortOption)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Property.countDocuments(filter)
        ]);

        res.json({
            properties,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum) || 1
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate(
            "owner",
            "name email phone"
        );

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        res.json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProperty = async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            type,
            status,
            bedrooms,
            bathrooms,
            area,
            location,
            address,
            ownerEmail
        } = req.body;

        if (!title || !description || !price || !type || !status || !area || !location) {
            return res.status(400).json({ message: "Missing required property fields" });
        }

        const images = (req.files || []).map((file) => `/uploads/${file.filename}`);

        let ownerId = req.user._id;

        // Admins may publish a listing on behalf of another user by email.
        if (req.user.role === "admin" && ownerEmail && ownerEmail.trim()) {
            const User = require("../models/User");
            const owner = await User.findOne({ email: ownerEmail.trim().toLowerCase() });
            if (!owner) {
                return res.status(404).json({ message: `No user found with email ${ownerEmail}` });
            }
            ownerId = owner._id;
        }

        const property = await Property.create({
            title,
            description,
            price,
            type,
            status,
            bedrooms,
            bathrooms,
            area,
            location,
            address,
            images,
            owner: ownerId
        });

        res.status(201).json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        const isOwner = property.owner.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to edit this property" });
        }

        const editableFields = [
            "title",
            "description",
            "price",
            "type",
            "status",
            "bedrooms",
            "bathrooms",
            "area",
            "location",
            "address"
        ];

        editableFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                property[field] = req.body[field];
            }
        });

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file) => `/uploads/${file.filename}`);
            property.images = property.images.concat(newImages);
        }

        await property.save();
        res.json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        const isOwner = property.owner.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to delete this property" });
        }

        await property.deleteOne();
        res.json({ message: "Property deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyProperties = async (req, res) => {
    try {
        const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
