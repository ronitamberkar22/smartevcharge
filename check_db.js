const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Station = require('./backend/models/Station');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Station.countDocuments();
  const stations = await Station.find().limit(5);
  console.log(`Total stations: ${count}`);
  console.log('Sample stations:', stations.map(s => s.name));
  process.exit(0);
}
check();
