// Seeds the database with a demo admin account and sample listings.
// Run with: npm run seed
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Property = require("./models/Property");

dotenv.config();

const sampleProperties = [
    {
        title: "Modern Hillside Villa",
        description:
            "A light-filled villa with floor-to-ceiling windows, a private pool, and panoramic hillside views. Open-plan living connects seamlessly to a landscaped terrace.",
        price: 450000,
        type: "Villa",
        status: "For Sale",
        bedrooms: 4,
        bathrooms: 3,
        area: 2800,
        location: "Aurangabad, Maharashtra",
        address: "12 Hillside Lane"
    },
    {
        title: "Downtown City Apartment",
        description:
            "A compact, efficient apartment in the heart of the city, walking distance to transit, cafes, and offices. Freshly renovated kitchen and bath.",
        price: 1200,
        type: "Apartment",
        status: "For Rent",
        bedrooms: 2,
        bathrooms: 1,
        area: 950,
        location: "Pune, Maharashtra",
        address: "45 Market Street, Apt 3B"
    },
    {
        title: "Cozy Family Home",
        description:
            "A warm, well-kept family home with a fenced backyard, two-car garage, and updated appliances throughout. Close to schools and parks.",
        price: 350000,
        type: "House",
        status: "For Sale",
        bedrooms: 3,
        bathrooms: 2,
        area: 1900,
        location: "Nashik, Maharashtra",
        address: "78 Maple Grove"
    },
    {
        title: "Riverside Condo",
        description:
            "A serene riverside condo with a private balcony, shared rooftop deck, and secure parking. Ideal for a quiet urban lifestyle.",
        price: 1800,
        type: "Condo",
        status: "For Rent",
        bedrooms: 1,
        bathrooms: 1,
        area: 780,
        location: "Mumbai, Maharashtra",
        address: "3 Riverside Court, Unit 9"
    },
    {
        title: "Open Development Plot",
        description:
            "A generous corner plot ready for development, zoned residential, with utilities already connected at the road.",
        price: 90000,
        type: "Land",
        status: "For Sale",
        bedrooms: 0,
        bathrooms: 0,
        area: 6000,
        location: "Aurangabad, Maharashtra",
        address: "Survey No. 214, Ring Road"
    },
    {
        title: "Sunlit Garden Apartment",
        description:
            "A ground-floor apartment with direct access to a shared garden, perfect for anyone who wants outdoor space without the upkeep.",
        price: 250000,
        type: "Apartment",
        status: "For Sale",
        bedrooms: 2,
        bathrooms: 2,
        area: 1150,
        location: "Pune, Maharashtra",
        address: "9 Garden View Road"
    }
];

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected. Seeding...");

    let admin = await User.findOne({ email: "admin@realestate.test" });
    if (!admin) {
        admin = await User.create({
            name: "Site Admin",
            email: "admin@realestate.test",
            password: process.env.ADMIN_PASSWORD,
            role: "admin"
        });
console.log("Created admin user: admin@realestate.test");    } else {
        console.log("Admin user already exists");
    }

    const existingCount = await Property.countDocuments();
    if (existingCount === 0) {
        const withOwner = sampleProperties.map((p) => ({ ...p, owner: admin._id }));
        await Property.insertMany(withOwner);
        console.log(`Inserted ${withOwner.length} sample properties`);
    } else {
        console.log("Properties already exist, skipping sample insert");
    }

    await mongoose.disconnect();
    console.log("Done.");
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
