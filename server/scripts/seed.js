// server/scripts/seed.js
//
// Populates the university list and, with --demo, a small set of users and
// journeys so a fresh deployment is not an empty page.
//
//   npm run seed
//   npm run seed -- --demo
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const University = require('../models/University');
const User = require('../models/User');
const Journey = require('../models/Journey');

const UNIVERSITIES = [
  { name: 'Thapar Institute of Engineering and Technology', location: { city: 'Patiala', state: 'Punjab', country: 'India' } },
  { name: 'Indian Institute of Technology Delhi', location: { city: 'New Delhi', state: 'Delhi', country: 'India' } },
  { name: 'Indian Institute of Technology Bombay', location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' } },
  { name: 'Indian Institute of Technology Madras', location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' } },
  { name: 'Indian Institute of Technology Kanpur', location: { city: 'Kanpur', state: 'Uttar Pradesh', country: 'India' } },
  { name: 'Birla Institute of Technology and Science, Pilani', location: { city: 'Pilani', state: 'Rajasthan', country: 'India' } },
  { name: 'Delhi Technological University', location: { city: 'New Delhi', state: 'Delhi', country: 'India' } },
  { name: 'Vellore Institute of Technology', location: { city: 'Vellore', state: 'Tamil Nadu', country: 'India' } },
  { name: 'Manipal Institute of Technology', location: { city: 'Manipal', state: 'Karnataka', country: 'India' } },
  { name: 'National Institute of Technology Trichy', location: { city: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'India' } },
  { name: 'Punjab Engineering College', location: { city: 'Chandigarh', state: 'Chandigarh', country: 'India' } },
  { name: 'Panjab University', location: { city: 'Chandigarh', state: 'Chandigarh', country: 'India' } },
];

// [lng, lat]
const PLACES = {
  Patiala: [76.3869, 30.3398],
  Delhi: [77.209, 28.6139],
  Chandigarh: [76.7794, 30.7333],
  Mumbai: [72.8777, 19.076],
  Jaipur: [75.7873, 26.9124],
  Dehradun: [78.0322, 30.3165],
  Amritsar: [74.8723, 31.634],
};

const point = (place) => ({ type: 'Point', coordinates: PLACES[place] });

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
};

const seedUniversities = async () => {
  const operations = UNIVERSITIES.map((university) => ({
    updateOne: {
      filter: { name: university.name },
      update: { $setOnInsert: university },
      upsert: true,
    },
  }));

  const result = await University.bulkWrite(operations);
  console.log(`Universities: ${result.upsertedCount} added, ${UNIVERSITIES.length} total in list.`);
};

const seedDemoData = async () => {
  const demoUsers = [
    {
      username: 'aarav',
      email: 'aarav@demo.travelbuddy.app',
      password: 'demo1234',
      fullName: 'Aarav Sharma',
      university: 'Thapar Institute of Engineering and Technology',
      hometown: 'Delhi',
      bio: 'Third year CSE. Home most long weekends.',
    },
    {
      username: 'diya',
      email: 'diya@demo.travelbuddy.app',
      password: 'demo1234',
      fullName: 'Diya Nair',
      university: 'Thapar Institute of Engineering and Technology',
      hometown: 'Mumbai',
      bio: 'Prefers trains. Always packs snacks.',
    },
    {
      username: 'kabir',
      email: 'kabir@demo.travelbuddy.app',
      password: 'demo1234',
      fullName: 'Kabir Singh',
      university: 'Punjab Engineering College',
      hometown: 'Amritsar',
      bio: 'Road trips over flights, every time.',
    },
  ];

  const users = [];

  for (const data of demoUsers) {
    let user = await User.findOne({ email: data.email });

    if (!user) {
      // Created one at a time so the password-hashing hook runs.
      user = await User.create(data);
      console.log(`Created demo user ${data.email} (password: ${data.password})`);
    }

    users.push(user);
  }

  const [aarav, diya, kabir] = users;

  const journeys = [
    {
      creator: aarav._id,
      creatorUniversity: aarav.university,
      origin: 'Patiala, Punjab',
      originCoords: point('Patiala'),
      destination: 'Delhi',
      destinationCoords: point('Delhi'),
      departureDate: daysFromNow(6),
      transportMode: 'bus',
      estimatedCost: 700,
      maxCompanions: 3,
      description: 'Heading home for the long weekend. Volvo from the bus stand, leaving early.',
    },
    {
      creator: diya._id,
      creatorUniversity: diya.university,
      origin: 'Patiala, Punjab',
      originCoords: point('Patiala'),
      destination: 'Chandigarh',
      destinationCoords: point('Chandigarh'),
      departureDate: daysFromNow(3),
      transportMode: 'car',
      estimatedCost: 400,
      maxCompanions: 3,
      description: 'Driving down for a concert, two seats free. Splitting fuel and tolls.',
    },
    {
      creator: kabir._id,
      creatorUniversity: kabir.university,
      origin: 'Chandigarh',
      originCoords: point('Chandigarh'),
      destination: 'Amritsar',
      destinationCoords: point('Amritsar'),
      departureDate: daysFromNow(11),
      transportMode: 'train',
      estimatedCost: 350,
      maxCompanions: 4,
      description: 'Morning train, back on Sunday night. Happy to coordinate tickets.',
    },
  ];

  for (const journey of journeys) {
    const exists = await Journey.exists({
      creator: journey.creator,
      origin: journey.origin,
      destination: journey.destination,
    });

    if (!exists) {
      journey.route = {
        type: 'LineString',
        coordinates: [journey.originCoords.coordinates, journey.destinationCoords.coordinates],
      };
      await Journey.create(journey);
      console.log(`Created demo journey ${journey.origin} -> ${journey.destination}`);
    }
  }
};

const run = async () => {
  await connectDB();
  await seedUniversities();

  if (process.argv.includes('--demo')) {
    await seedDemoData();
  }

  await mongoose.connection.close();
  console.log('Seed complete.');
};

run().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
