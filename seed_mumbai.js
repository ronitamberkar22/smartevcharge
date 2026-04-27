const mongoose = require('mongoose');
const Station = require('./backend/models/Station');
const Slot = require('./backend/models/Slot');
require('dotenv').config({ path: './backend/.env' });

const stationsData = [
  { name: "Ather Space Thane", cityArea: "Mumbai", address: "Shop No. 4, Mansarovar, Opp. TMC Building, Almeda Rd", lat: 19.1981177, lng: 72.96741506 },
  { name: "BMC Market Bhandup", cityArea: "Mumbai", address: "320, 3rd Floor, BMC Market, Station Road, Bhandup West", lat: 19.14477582, lng: 72.93714663 },
  { name: "BMC Parking Runwal Greens", cityArea: "Mumbai", address: "Nahur West, Industrial Area, Bhandup West, Mumbai", lat: 19.1593952, lng: 72.945112 },
  { name: "Blue Tokai Coffee", cityArea: "Mumbai", address: "Unit 20-22, Laxmi Woollen Mill, Opposite Blue Loft", lat: 18.989356, lng: 72.825234 },
  { name: "Brookfield, Powai (Main)", cityArea: "Mumbai", address: "Pay & Park, Central Ave, Hiranandani Gardens, Powai", lat: 19.11644, lng: 72.90968 },
  { name: "Brookfield, Powai (Spectra)", cityArea: "Mumbai", address: "Spectra, High St, Hiranandani Gardens, Powai, Mumbai", lat: 19.11637, lng: 72.91086 },
  { name: "CR - Bhandup Station", cityArea: "Mumbai", address: "Bhandup Station East, near Kotak Mahindra ATM, Mumbai", lat: 19.1420246, lng: 72.937755 },
  { name: "CSMT Station, Fort", cityArea: "Mumbai", address: "Chhatrapati Shivaji Maharaj Terminus, Fort, Mumbai", lat: 18.9453551, lng: 72.8383287 },
  { name: "Carnival Cinemas Imax", cityArea: "Mumbai", address: "Carnival Cinemas Imax, Anik Wadala Link Rd, Bhakti Park", lat: 19.0313299, lng: 72.8809653 },
  { name: "Charge Zone (NSCI Worli)", cityArea: "Mumbai", address: "NSCI - Worli, NSCI, Lala Lajpatrai Marg, Mumbai", lat: 18.9862222, lng: 72.8149436 },
  { name: "Charge Zone (Westin Powai)", cityArea: "Mumbai", address: "The Westin Mumbai Powai Lake, Mumbai", lat: 19.133659, lng: 72.900817 },
  { name: "Evershine Mall Charging Station", cityArea: "Mumbai", address: "Chincholi Bunder Road, New Link Rd, Malad West", lat: 19.1798, lng: 72.8361 },
  { name: "Ginger Mumbai, Andheri East", cityArea: "Mumbai", address: "Teli - Gali Road, Andheri (East), Mumbai", lat: 19.11599, lng: 72.85018 },
  { name: "Inderjit Cars, Andheri West", cityArea: "Mumbai", address: "1059/1060, Adarsh nagar, near infinity mall, Mumbai", lat: 19.14207, lng: 72.83241 },
  { name: "K Star Chembur", cityArea: "Mumbai", address: "VN Purav Marg Diamond Garden, Basant Garden, Chembur", lat: 19.05231631, lng: 72.90163581 },
  { name: "Kabra Metro One", cityArea: "Mumbai", address: "14, JP Rd, Aram Nagar, Seven Bunglow, Andheri West", lat: 19.13030121, lng: 72.82229723 },
  { name: "Kala Ghoda Cafe", cityArea: "Mumbai", address: "10, Rope Walk Ln, Kala Ghoda, Fort, Mumbai", lat: 18.92845451, lng: 72.83203031 },
  { name: "Kohinoor Altissimo", cityArea: "Mumbai", address: "Kohinoor Altissimo Residential Tower, Kohinoor Altissimo", lat: 19.0246, lng: 72.8402 },
  { name: "Kohinoor MCGM parking", cityArea: "Mumbai", address: "Kohinoor Square, Kasaravadi, Dadar, Mumbai", lat: 19.02460889, lng: 72.84282021 },
  { name: "Lodha Fiorenza", cityArea: "Mumbai", address: "On Western Express Highway, adjacent to Hub Mall", lat: 19.15381142, lng: 72.85579572 },
  { name: "Lodha Venezia CPL", cityArea: "Mumbai", address: "GD Ambedkar Marg, Lal Baug, Parel, Mumbai", lat: 18.9917205, lng: 72.841513 },
  { name: "MCGM Parking || Club Aquaria", cityArea: "Mumbai", address: "Devidas Lane, Shanti Ashram Borivali West, Mumbai", lat: 19.2402364, lng: 72.8481819 },
  { name: "MCGM Parking || Runwal Anthurium", cityArea: "Mumbai", address: "Runwal Anthurium Rd, opposite Veena Nagar, Mumbai", lat: 19.18066617, lng: 72.94684724 },
  { name: "Magenta House - Mumbai", cityArea: "Mumbai", address: "TTC Industrial Area, MIDC Industrial Area, Sanpada", lat: 19.06870454, lng: 73.02298692 },
  { name: "Mahanagar Gas Limited, Wadala", cityArea: "Mumbai", address: "MGI Terminal, opposite Anik Depot, Wadala, Mumbai", lat: 19.0472567, lng: 72.8783829 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    for (const data of stationsData) {
      const station = new Station({
        name: data.name,
        cityArea: data.cityArea,
        address: data.address,
        latitude: data.lat,
        longitude: data.lng,
        totalSlots: 10,
        availableSlots: 10,
        pricePerHour: 8,
        priceAC: 8,
        priceDC: 12,
        priceSuperFast: 18,
        operator: data.name.split(' ')[0],
        status: 'active'
      });

      const saved = await station.save();
      
      const slots = [];
      for (let i = 1; i <= 10; i++) {
        slots.push({
          station: saved._id,
          slotNumber: i,
          connectorType: 'CCS',
          maxPower: 50
        });
      }
      await Slot.insertMany(slots);
      console.log(`Added: ${data.name}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
