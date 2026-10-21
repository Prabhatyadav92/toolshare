require('dotenv').config();
const User = require('./models/User');
const Tool = require('./models/Tool');
const Booking = require('./models/Booking');

// Approximate coordinates of localities around Delhi NCR (keep in sync with client/src/constants.js)
const L = {
  alpha1: { locality: 'Alpha 1', city: 'Greater Noida', lat: 28.4744, lng: 77.5085 },
  pari: { locality: 'Pari Chowk', city: 'Greater Noida', lat: 28.4646, lng: 77.5176 },
  kp3: { locality: 'Knowledge Park III', city: 'Greater Noida', lat: 28.4627, lng: 77.4897 },
  gaur: { locality: 'Gaur City 1', city: 'Greater Noida West', lat: 28.6086, lng: 77.4372 },
  sec62: { locality: 'Sector 62', city: 'Noida', lat: 28.6273, lng: 77.3649 },
  sec18: { locality: 'Sector 18', city: 'Noida', lat: 28.5706, lng: 77.3219 },
  indira: { locality: 'Indirapuram', city: 'Ghaziabad', lat: 28.6460, lng: 77.3690 },
  lajpat: { locality: 'Lajpat Nagar', city: 'New Delhi', lat: 28.5677, lng: 77.2433 },
};

const users = [
  { key: 'prabhat', name: 'Prabhat Yadav', email: 'prabhat@example.com', loc: L.kp3 },
  { key: 'aarav', name: 'Aarav Sharma', email: 'aarav@example.com', loc: L.sec62 },
  { key: 'priya', name: 'Priya Singh', email: 'priya@example.com', loc: L.indira },
  { key: 'rohan', name: 'Rohan Verma', email: 'rohan@example.com', loc: L.alpha1 },
  { key: 'ananya', name: 'Ananya Gupta', email: 'ananya@example.com', loc: L.lajpat },
  { key: 'imran', name: 'Imran Khan', email: 'imran@example.com', loc: L.sec18 },
];

const IMG = {
  drill: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
  mower: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=900&q=80',
  washer: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=900&q=80',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80',
  cleaner: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=80',
  saw: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=900&q=80',
};

// owner key, tool data, and which loc to use (defaults to owner's locality)
const tools = [
  { key: 'drill', owner: 'prabhat', name: 'Bosch GSB 500 RE Impact Drill Kit', category: 'Power Tools', subcategory: 'Workshop & Drilling', condition: 'Like New', pricePerDay: 0, deposit: 500, instantBook: true, imageUrl: IMG.drill, description: 'Corded 500W impact drill with 13mm chuck, 40-piece bit set and masonry bits. Perfect for hanging shelves, curtain rods and AC brackets. Pickup near Knowledge Park III.' },
  { key: 'ladder', owner: 'prabhat', name: 'Aluminium Folding Ladder (6 ft)', category: 'Ladders', subcategory: 'Home Repairs', condition: 'Good', pricePerDay: 0, deposit: 300, instantBook: true, imageUrl: '', description: 'Lightweight folding ladder, easy to carry on a bike or in an auto. Good for painting, fan cleaning and Diwali lights.' },
  { key: 'washer', owner: 'aarav', name: 'Kärcher K2 High-Pressure Washer', category: 'Home & Cleaning', subcategory: 'Exterior Cleaning', condition: 'Heavy Duty', pricePerDay: 150, deposit: 2000, instantBook: false, imageUrl: IMG.washer, description: 'Ideal for car, bike, terrace and balcony cleaning before festivals. Includes 6m hose and foam nozzle.' },
  { key: 'saw', owner: 'aarav', name: 'Bosch 10-inch Sliding Mitre Saw', category: 'Power Tools', subcategory: 'Woodworking', condition: 'Heavy Duty', pricePerDay: 400, deposit: 5000, instantBook: true, imageUrl: IMG.saw, description: 'Accurate bevel and mitre cuts with laser guide. Great for wardrobe and modular kitchen work. You must carry it by car.' },
  { key: 'idli', owner: 'priya', name: 'Large Steel Idli Steamer (24 idlis)', category: 'Kitchen', subcategory: 'Festive Cooking', condition: 'Excellent', pricePerDay: 0, deposit: 300, instantBook: true, imageUrl: '', description: 'Heavy-bottom steamer with 4 plates, ideal for puja, parties and family functions when you need many idlis at once.' },
  { key: 'sewing', owner: 'priya', name: 'Usha Janome Allure Sewing Machine', category: 'Other', subcategory: 'Hobby & Craft', condition: 'Good', pricePerDay: 80, deposit: 1500, instantBook: false, imageUrl: '', description: 'Automatic zig-zag machine with a foot-pedal. Handy for quick alterations, blouse stitching and school project costumes.' },
  { key: 'mower', owner: 'rohan', name: 'Bosch Rotak Electric Lawn Mower', category: 'Gardening', subcategory: 'Lawn Care', condition: 'Excellent', pricePerDay: 200, deposit: 3000, instantBook: true, imageUrl: IMG.mower, description: '1200W electric mower with grass catcher, good for society gardens and farmhouse lawns. 10m cable included.' },
  { key: 'trimmer', owner: 'rohan', name: 'Cordless Hedge Trimmer', category: 'Gardening', subcategory: 'Hedge & Shrubs', condition: 'Good', pricePerDay: 120, deposit: 1500, instantBook: false, imageUrl: '', description: 'Battery trimmer for boundary hedges and terrace plants. Fully charged lasts about 40 minutes.' },
  { key: 'sofa', owner: 'ananya', name: 'Sofa & Carpet Wet-Dry Cleaner', category: 'Home & Cleaning', subcategory: 'Interior Care', condition: 'Good', pricePerDay: 100, deposit: 1500, instantBook: false, available: false, imageUrl: IMG.cleaner, description: 'Removes stains from sofas, mattresses, carpets and car seats. Comes with a deep-stain nozzle.' },
  { key: 'pasta', owner: 'imran', name: 'Stainless Steel Pasta & Noodle Machine', category: 'Kitchen', subcategory: 'Culinary Gear', condition: 'Like New', pricePerDay: 0, deposit: 800, instantBook: true, imageUrl: IMG.pasta, description: 'Hand-crank roller with fettuccine and spaghetti cutters. Also works for homemade sev and thin noodles.' },
];

// Completed loans with reviews so ratings and badges look real in the demo
const history = [
  ['drill', 'aarav', 5, 'Ekdum mast drill, 2 ghante mein shelf lag gayi. Prabhat bhai ne time par de diya.'],
  ['drill', 'priya', 5, 'Smooth experience. Bits bhi saath mein mile.'],
  ['drill', 'rohan', 4, 'Works great, bas batteries ki jagah corded hai toh extension lagani padi.'],
  ['ladder', 'imran', 5, 'Light aur strong, Diwali lights lagane ke liye perfect.'],
  ['washer', 'prabhat', 5, 'Car aur balcony dono saaf ho gaye. Aarav ji very helpful.'],
  ['washer', 'rohan', 4, 'Good pressure. Returned clean.'],
  ['saw', 'rohan', 5, 'Precise cuts, laser guide is a lifesaver.'],
  ['saw', 'imran', 5, 'Pro-grade machine, owner explained safety clearly.'],
  ['idli', 'ananya', 5, 'Griha pravesh ke liye liya tha, 100 idlis aaraam se bane.'],
  ['mower', 'prabhat', 5, 'Society lawn ek hi shaam mein ho gaya.'],
  ['pasta', 'priya', 5, 'Fresh pasta aur sev dono bane. Imran bhai ka thanks!'],
  ['pasta', 'ananya', 5, 'Super clean machine.'],
  ['sofa', 'priya', 4, 'Sofa ke daag chale gaye, thoda heavy hai.'],
  ['sofa', 'aarav', 5, 'Worked well for car seats too.'],
];

async function seedData() {
  await Promise.all([User.deleteMany({}), Tool.deleteMany({}), Booking.deleteMany({})]);

  const byKey = {};
  for (const u of users) {
    byKey[u.key] = await User.create({
      name: u.name,
      email: u.email,
      password: 'password123',
      locality: u.loc.locality,
      city: u.loc.city,
      country: 'India',
      lat: u.loc.lat,
      lng: u.loc.lng,
    });
  }

  const toolByKey = {};
  for (const t of tools) {
    const owner = users.find((u) => u.key === t.owner);
    const { key, owner: ownerKey, ...fields } = t;
    toolByKey[key] = await Tool.create({
      ...fields,
      owner: byKey[ownerKey]._id,
      locality: owner.loc.locality,
      city: owner.loc.city,
      country: 'India',
      lat: owner.loc.lat,
      lng: owner.loc.lng,
    });
  }

  const day = 86400000;
  let i = 0;
  for (const [toolKey, borrowerKey, rating, comment] of history) {
    i += 1;
    const tool = toolByKey[toolKey];
    const start = new Date(Date.now() - (60 - i * 3) * day);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + day);
    await Booking.create({
      tool: tool._id,
      owner: tool.owner,
      borrower: byKey[borrowerKey]._id,
      startDate: start,
      endDate: end,
      days: 2,
      rentalCost: 2 * tool.pricePerDay,
      deposit: tool.deposit,
      pickupWindow: 'Evening (5 PM - 8 PM)',
      status: 'returned',
      review: { rating, comment, createdAt: new Date(end.getTime() + day) },
    });
  }

  for (const t of Object.values(toolByKey)) {
    const [agg] = await Booking.aggregate([
      { $match: { tool: t._id, 'review.rating': { $exists: true } } },
      { $group: { _id: '$tool', avg: { $avg: '$review.rating' }, n: { $sum: 1 } } },
    ]);
    if (agg) await Tool.findByIdAndUpdate(t._id, { ratingAvg: Math.round(agg.avg * 10) / 10, ratingCount: agg.n });
  }

  console.log(`Seeded ${users.length} users, ${tools.length} tools, ${history.length} reviews.`);
  console.log('Login: prabhat@example.com / password123');
}

module.exports = seedData;

// Allow: node seed.js
if (require.main === module) {
  const { connectDB, disconnectDB } = require('./db');
  connectDB()
    .then(async ({ memory }) => {
      if (memory) {
        console.log('Note: in-memory DB is temporary. Start MongoDB or set MONGO_URI to keep seeded data.');
      }
      const existing = await User.countDocuments();
      if (existing > 0 && !memory && !process.argv.includes('--force')) {
        console.error(
          `This database already has ${existing} users. Seeding WIPES all users, tools and bookings.\n` +
            'Re-run with --force if that is what you want:  npm run seed -- --force'
        );
        await disconnectDB();
        process.exit(1);
      }
      await seedData();
      await disconnectDB();
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
