# SmartEVCharge - Full Stack EV Charging Slot Booking System

A complete full-stack EV charging slot booking system with Node.js, Express, MongoDB, and modern frontend.

## Project Structure

```
smartevcharge-server/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Station.js         # Charging station model
│   │   ├── Slot.js            # Charging slot model
│   │   ├── Booking.js         # Booking model
│   │   └── Payment.js         # Payment model
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── stationController.js
│   │   ├── bookingController.js
│   │   ├── slotController.js  # Slot recommendation algorithm
│   │   └── paymentController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── stations.js
│   │   ├── bookings.js
│   │   ├── slots.js
│   │   └── payments.js
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── server.js              # Express server
│   ├── seed.js                # Database seeder
│   ├── .env.example           # Environment variable template (copy to .env)
│   └── seed.js                # Database seeder
├── frontend/
│   ├── user/
│   │   ├── login.html         # User login/register
│   │   └── dashboard.html     # User dashboard
│   └── admin/
│       ├── login.html         # Admin login
│       └── dashboard.html     # Admin dashboard
├── package.json
└── README.md
```

## Features

### Backend
- ✅ RESTful APIs for auth, stations, bookings, slots, payments
- ✅ JWT authentication for users and admins
- ✅ MongoDB database with Mongoose ODM
- ✅ Slot recommendation using greedy algorithm
- ✅ Payment processing (simulated)

### Frontend
- ✅ User portal: Login, Register, Dashboard, Stations, Bookings, Payments
- ✅ Admin portal: Login, Dashboard, Manage Stations, Bookings, Users, Payments
- ✅ Modern UI with neon green/purple themes
- ✅ API integration with fetch

### Greedy Algorithm for Slot Recommendation
The slot recommendation algorithm considers:
1. **Charging speed** - Faster charging prioritized for short durations
2. **Power efficiency** - kW per dollar ratio
3. **Connector compatibility** - Preferred connector types
4. **Slot position** - Lower numbered slots preferred

## Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
# Copy the example files and fill in your real values
cp .env.example .env
cp backend/.env.example backend/.env
```
Then edit both `.env` files with your MongoDB URI, JWT secret, Gmail credentials, and OCM API key.
> ⚠️ **Never commit your `.env` files.** They are gitignored automatically.

3. **Seed the database:**
```bash
node backend/seed.js
```

4. **Start the server:**
```bash
npm start
```

The API will be available at `http://localhost:3000/api`

## Running the Application

### Backend
```bash
npm start        # Production
npm run dev      # Development (with nodemon)
```

### Frontend
Open the HTML files in a browser:
- User Portal: `frontend/user/login.html`
- Admin Portal: `frontend/admin/login.html`

Or serve them with a static server:
```bash
npx serve frontend
```

## Default Seeded Accounts (after running `node backend/seed.js`)

### Admin
- Email: `admin@smartevcharge.com`
- Password: `admin123`

### Sample User
- Email: `john@example.com`
- Password: `user123`

> 💡 Change these credentials immediately after your first login in production.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Stations
- `GET /api/stations` - Get all stations
- `GET /api/stations/:id` - Get station details
- `GET /api/stations/nearby` - Get nearby stations
- `POST /api/stations` - Create station (admin)
- `PUT /api/stations/:id` - Update station (admin)
- `DELETE /api/stations/:id` - Delete station (admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings` - Get all bookings (admin)

### Slots
- `GET /api/slots/available` - Get available slots
- `GET /api/slots/recommend` - Get slot recommendations (greedy algorithm)
- `GET /api/slots/availability` - Get slot availability for date range

### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments/my` - Get user's payments
- `GET /api/payments` - Get all payments (admin)

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Nodemailer
- **Frontend:** HTML, CSS, JavaScript (Vanilla), Leaflet.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT (JSON Web Tokens)
- **Maps:** Leaflet.js + OpenChargeMap API + OpenStreetMap Overpass
- **Email:** Nodemailer (Gmail SMTP)

## License

MIT