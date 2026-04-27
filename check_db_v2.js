const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Station = require('./backend/models/Station');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const stations = await Station.find().lean();
  console.log('JSON START');
  console.log(JSON.stringify(stations.slice(0, 3), null, 2));
  console.log('JSON END');
  console.log('COUNT:', stations.length);
  process.exit(0);
}
check();
