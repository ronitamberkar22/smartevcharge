// filepath: backend/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/.env' });

// Models
const User = require('./models/User');
const Station = require('./models/Station');
const Slot = require('./models/Slot');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected');
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Station.deleteMany({});
    await Slot.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin User (password hashed automatically by User model pre-save hook)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@smartevcharge.com',
      password: 'admin123',
      phone: '+1234567890',
      role: 'admin',
      isActive: true
    });
    console.log('Admin created: admin@smartevcharge.com / admin123');

    // Create Test User
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'user123',
      phone: '+0987654321',
      role: 'user',
      isActive: true
    });
    console.log('User created: john@example.com / user123');

    // Create Stations
    const stations = [
      {
        name: 'Downtown EV Hub',
        address: '123 Main Street, Downtown',
        latitude: 40.7128,
        longitude: -74.0060,
        totalSlots: 10,
        availableSlots: 8,
        pricePerHour: 15.00,
        chargingSpeed: 'fast',
        connectorTypes: ['Type2', 'CCS'],
        amenities: ['wifi', 'parking', 'cafe'],
        status: 'active'
      },
      {
        name: 'Mall Charging Center',
        address: '456 Shopping Plaza, Westside',
        latitude: 40.7580,
        longitude: -73.9855,
        totalSlots: 20,
        availableSlots: 15,
        pricePerHour: 12.00,
        chargingSpeed: 'fast',
        connectorTypes: ['Type2', 'Tesla'],
        amenities: ['wifi', 'parking', 'shopping'],
        status: 'active'
      },
      {
        name: 'Highway Fast Charge',
        address: 'Exit 42, Highway 101',
        latitude: 40.6892,
        longitude: -74.0445,
        totalSlots: 8,
        availableSlots: 6,
        pricePerHour: 20.00,
        chargingSpeed: 'super-fast',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['restroom', 'cafe'],
        status: 'active'
      },
      {
        name: 'Office Park Charging',
        address: '789 Business Park, Tech District',
        latitude: 40.7484,
        longitude: -73.9857,
        totalSlots: 15,
        availableSlots: 12,
        pricePerHour: 10.00,
        chargingSpeed: 'slow',
        connectorTypes: ['Type2'],
        amenities: ['wifi', 'parking'],
        status: 'active'
      },
      {
        name: 'Residential Complex',
        address: '101 Green Valley Apartments',
        latitude: 40.7306,
        longitude: -73.9352,
        totalSlots: 5,
        availableSlots: 4,
        pricePerHour: 8.00,
        chargingSpeed: 'slow',
        connectorTypes: ['Type2'],
        amenities: ['parking'],
        status: 'active'
      }
    ];

    for (const stationData of stations) {
      const station = await Station.create(stationData);
      
      // Create slots for each station
      const slots = [];
      for (let i = 1; i <= stationData.totalSlots; i++) {
        slots.push({
          station: station._id,
          slotNumber: i,
          connectorType: stationData.connectorTypes[0],
          maxPower: stationData.chargingSpeed === 'super-fast' ? 150 : stationData.chargingSpeed === 'fast' ? 50 : 22,
          status: 'available',
          isAvailable: true
        });
      }
      await Slot.insertMany(slots);
      console.log(`Created station: ${station.name} with ${stationData.totalSlots} slots`);
    }

    console.log('\n✅ Seed data created successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@smartevcharge.com / admin123');
    console.log('User: john@example.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

connectDB().then(seedData);