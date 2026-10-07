# Keystone &mdash; Real Estate Portal

A full-stack real estate portal: property listings, search & filters, favorites,
owner messaging, listing management, and an admin dashboard. Node/Express/MongoDB
backend with JWT auth, and a vanilla HTML/CSS/JS frontend served as static files.

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt password hashing, Multer for image uploads
- **Frontend:** HTML5, CSS3, vanilla JavaScript (no framework, no build step)

## Requirements

- Node.js 18+
- A MongoDB instance (local `mongod`, or a free cluster on MongoDB Atlas)

## Setup

```bash
cd real-estate-portal
npm install
cp .env.example .env
# edit .env: set MONGODB_URI and a real JWT_SECRET
npm run dev        # starts with nodemon on http://localhost:5000
# or: npm start
```

Open http://localhost:5000 in your browser.

### Optional: seed demo data

```bash
npm run seed
```

This creates an admin account (`admin@realestate.test` / `Admin@123`) and six
sample listings so the site isn't empty on first run. Change that password
immediately if you deploy this anywhere public.

## Project structure

```
real-estate-portal/
├── server.js              Express app entry point
├── seed.js                 Optional demo-data seeder
├── models/                 Mongoose schemas (User, Property, Message)
├── controllers/             Route handlers / business logic
├── routes/                  Express routers, mounted under /api
├── middleware/               auth (JWT), admin (role check), upload (multer)
└── public/                   Static frontend
    ├── *.html                 One page per view
    ├── css/                    style.css (tokens + components), responsive.css
    └── js/                     api.js (fetch/session helpers) + one file per page
```

## API reference

```
AUTH
POST   /api/auth/register        { name, email, password, phone? }
POST   /api/auth/login           { email, password }
GET    /api/auth/me              (auth required)

PROPERTIES
GET    /api/properties           ?location&type&status&minPrice&maxPrice&bedrooms&bathrooms&q&sort&page&limit
GET    /api/properties/:id
GET    /api/properties/mine      (auth required)
POST   /api/properties           (auth required, multipart/form-data, field "images")
PUT    /api/properties/:id       (auth required, owner or admin)
DELETE /api/properties/:id       (auth required, owner or admin)

FAVORITES
GET    /api/favorites            (auth required)
POST   /api/favorites/:propertyId
DELETE /api/favorites/:propertyId

MESSAGES
POST   /api/messages             { propertyId, subject?, message }
GET    /api/messages             (auth required — messages you've received)
PUT    /api/messages/:id/read

ADMIN (auth + admin role required)
GET    /api/admin/dashboard
GET    /api/admin/users
DELETE /api/admin/users/:id
GET    /api/admin/properties
```

## Notes

- The frontend never uses fake/static property data — every page fetches
  from the API and renders whatever is actually in MongoDB.
- Uploaded images are stored on disk under `public/uploads` and served at
  `/uploads/<filename>`. For a production deployment behind multiple server
  instances, swap this for S3/Cloud Storage.
- To promote a user to admin manually: in `mongosh`,
  `db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })`.
