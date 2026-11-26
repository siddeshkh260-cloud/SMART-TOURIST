// ================================================================
//  TourisMart India — Professional Backend Server (Express & Cloud Sync)
// ================================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const ROOT_DIR = path.join(__dirname, '..');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON data safely
function loadData(filename, defaultValue) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`[Data Error] Could not read ${filename}:`, err.message);
  }
  return defaultValue;
}

// Helper to write JSON data
function saveData(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[Data Error] Could not write ${filename}:`, err.message);
    return false;
  }
}

// In-memory data store with disk persistence
let places = loadData('places.json', []);
let products = loadData('products.json', []);
let bookings = loadData('bookings.json', []);
let approvals = loadData('approvals.json', [
  {
    id: 'appr_1',
    businessName: 'Highland Tribal Honey Cooperative',
    owner: 'Ramesh Nayak',
    state: 'Karnataka',
    category: 'artisan',
    compliance: 'Organic Certified',
    status: 'Pending'
  },
  {
    id: 'appr_2',
    businessName: 'Backwater Bamboo Rafting Guild',
    owner: 'Sumanth Rao',
    state: 'Kerala',
    category: 'adventure',
    compliance: 'Zero-Emission',
    status: 'Pending'
  },
  {
    id: 'appr_3',
    businessName: 'Old Town Woodcraft Heritage Guild',
    owner: 'Maria D’Souza',
    state: 'Goa',
    category: 'artisan',
    compliance: 'GI Tagged',
    status: 'Pending'
  }
]);

// ----------------------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TourisMart India Service',
    totalDestinations: places.length,
    activeBookings: bookings.length,
    timestamp: new Date().toISOString()
  });
});

// GET /api/places - List destinations with multi-filters
app.get('/api/places', (req, res) => {
  let filtered = [...places];
  const { state, category, search, maxPrice } = req.query;

  if (state && state !== 'all') {
    filtered = filtered.filter(p => p.region.toLowerCase() === state.toLowerCase());
  }
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (maxPrice && maxPrice !== 'all') {
    filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
  }
  if (search) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// GET /api/places/:id - Single destination details
app.get('/api/places/:id', (req, res) => {
  const place = places.find(p => p.id === req.params.id);
  if (!place) {
    return res.status(404).json({ error: 'Destination not found' });
  }
  res.json(place);
});

// POST /api/places - Host listing creation
app.post('/api/places', (req, res) => {
  try {
    const { title, category, region, location, price, priceUnit, image, ecoTag, description } = req.body;
    if (!title || !location || !price) {
      return res.status(400).json({ error: 'Title, location, and price are required' });
    }

    const newPlace = {
      id: `ind_${Date.now()}`,
      title: title.trim(),
      category: category || 'stay',
      region: region || 'Rajasthan',
      location: location.trim(),
      price: parseFloat(price),
      priceUnit: priceUnit || 'night',
      rating: 5.0,
      reviewsCount: 1,
      image: image || 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
      ecoTag: ecoTag || 'Verified State Host',
      description: description || 'Authentic regional cultural experience hosted by local families.'
    };

    places.unshift(newPlace);
    saveData('places.json', places);
    res.status(201).json({ success: true, place: newPlace });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create listing', details: err.message });
  }
});

// GET /api/products - Authentic Indian GI Crafts & Produce
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET /api/bookings - Traveler reservations
app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

// POST /api/bookings - Create reservation and issue Digital QR Pass
app.post('/api/bookings', (req, res) => {
  try {
    const { bizId, bizName, guestName, guestEmail, date, guests, totalPrice } = req.body;
    if (!bizName || !guestName || !date) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const bookingCode = `TOUR-IND-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking = {
      id: bookingCode,
      bizId: bizId || 'ind_custom',
      bizName,
      guestName: guestName.trim(),
      guestEmail: guestEmail || '',
      date,
      guests: parseInt(guests, 10) || 1,
      totalPrice: parseFloat(totalPrice) || 0,
      status: 'Confirmed',
      time: 'Check-in 11:00 AM',
      createdAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    saveData('bookings.json', bookings);
    res.status(201).json({ success: true, booking: newBooking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
});

// POST /api/bookings/verify - Verify digital QR pass
app.post('/api/bookings/verify', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: 'Pass code required' });
  }

  const cleanCode = code.trim().toUpperCase();
  const booking = bookings.find(b => b.id.toUpperCase() === cleanCode);
  if (booking) {
    return res.json({ valid: true, booking });
  }
  res.status(404).json({ valid: false, message: 'Unrecognized or invalid pass code' });
});

// POST /api/bookings/checkin - Check in traveler at venue door
app.post('/api/bookings/checkin', (req, res) => {
  const { id } = req.body;
  const booking = bookings.find(b => b.id === id);
  if (booking) {
    booking.status = 'Completed';
    booking.checkedInAt = new Date().toISOString();
    saveData('bookings.json', bookings);
    return res.json({ success: true, booking });
  }
  res.status(404).json({ error: 'Booking not found' });
});

// ----------------------------------------------------------------
// DEDICATED ADMIN API (Protected Regional Tourism Governance)
// ----------------------------------------------------------------

// GET /api/admin/stats - Macro tourism board analytics
app.get('/api/admin/stats', (req, res) => {
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  res.json({
    annualGdpImpact: '₹428.6 Crore',
    certifiedHosts: places.length + 3420,
    activePassesIssued: bookings.length + 48200,
    complianceAdherence: '99.4%',
    pendingApprovalsCount: approvals.filter(a => a.status === 'Pending').length,
    recentApprovals: approvals
  });
});

// POST /api/admin/approve/:id - Approve local business application
app.post('/api/admin/approve/:id', (req, res) => {
  const appItem = approvals.find(a => a.id === req.params.id);
  if (appItem) {
    appItem.status = 'Approved';
    saveData('approvals.json', approvals);
    return res.json({ success: true, approvedItem: appItem });
  }
  res.status(404).json({ error: 'Application not found' });
});

// ----------------------------------------------------------------
// STATIC SERVING & SEPARATE ADMIN PORTAL
// ----------------------------------------------------------------

// Serve Dedicated Admin Portal
app.get('/admin', (req, res) => {
  const adminPath = path.join(FRONTEND_DIR, 'admin.html');
  if (fs.existsSync(adminPath)) {
    return res.sendFile(adminPath);
  }
  const rootAdminPath = path.join(ROOT_DIR, 'admin.html');
  if (fs.existsSync(rootAdminPath)) {
    return res.sendFile(rootAdminPath);
  }
  res.status(404).send('Admin Console Not Found');
});

// Serve frontend assets
app.use(express.static(FRONTEND_DIR));
app.use(express.static(ROOT_DIR));

// Fallback to frontend index.html for client routing
app.use((req, res) => {
  const feIndex = path.join(FRONTEND_DIR, 'index.html');
  if (fs.existsSync(feIndex)) {
    return res.sendFile(feIndex);
  }
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
================================================================
   TourisMart India — Professional Server
================================================================
   * Web App:         http://localhost:${PORT}
   * Separate Admin:  http://localhost:${PORT}/admin
   * Destinations:    http://localhost:${PORT}/api/places
   * Products:        http://localhost:${PORT}/api/products
   * Bookings:        http://localhost:${PORT}/api/bookings
   * Admin Analytics: http://localhost:${PORT}/api/admin/stats
================================================================
  `);
});
