// ================================================================
//  TourisMart India — Backend Server (Node.js & Express REST API)
// ================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Helper to read JSON data safely
function loadData(filename, defaultValue) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
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
    console.error(`Error writing ${filename}:`, err.message);
    return false;
  }
}

// In-memory data store with disk persistence
let places = loadData('places.json', []);
let products = loadData('products.json', []);
let bookings = loadData('bookings.json', []);

// MIME types for static frontend serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create Native HTTP Server (No external npm packages strictly required to run!)
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  // ----------------------------------------------------------------
  // REST API ROUTES (/api/*)
  // ----------------------------------------------------------------

  // Health Check
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'TourisMart India API', timestamp: new Date().toISOString() }));
    return;
  }

  // GET /api/places - List all destinations with filtering
  if (req.method === 'GET' && pathname === '/api/places') {
    let filtered = [...places];

    const state = searchParams.get('state');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const maxPrice = searchParams.get('maxPrice');

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
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(filtered));
    return;
  }

  // GET /api/places/:id - Single place details
  if (req.method === 'GET' && pathname.startsWith('/api/places/')) {
    const id = pathname.replace('/api/places/', '');
    const place = places.find(p => p.id === id);
    if (!place) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Destination place not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(place));
    return;
  }

  // POST /api/places - Create new destination listing (Host)
  if (req.method === 'POST' && pathname === '/api/places') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newPlace = JSON.parse(body);
        newPlace.id = newPlace.id || ('ind_' + Date.now());
        newPlace.rating = newPlace.rating || 5.0;
        newPlace.reviewsCount = newPlace.reviewsCount || 1;
        places.unshift(newPlace);
        saveData('places.json', places);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, place: newPlace }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // GET /api/products - Indian GI Marketplace items
  if (req.method === 'GET' && pathname === '/api/products') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(products));
    return;
  }

  // GET /api/bookings - List reservations
  if (req.method === 'GET' && pathname === '/api/bookings') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(bookings));
    return;
  }

  // POST /api/bookings - Create new tourist booking & QR pass
  if (req.method === 'POST' && pathname === '/api/bookings') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const bookingReq = JSON.parse(body);
        const bookingId = bookingReq.id || ('TOUR-IND-' + Math.floor(1000 + Math.random() * 9000));
        const newBooking = {
          id: bookingId,
          bizId: bookingReq.bizId,
          bizName: bookingReq.bizName,
          guestName: bookingReq.guestName,
          guestEmail: bookingReq.guestEmail,
          date: bookingReq.date,
          guests: bookingReq.guests || 2,
          totalPrice: bookingReq.totalPrice,
          status: 'Confirmed',
          time: bookingReq.time || 'Check-in 11:00 AM',
          createdAt: new Date().toISOString()
        };
        bookings.unshift(newBooking);
        saveData('bookings.json', bookings);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, booking: newBooking }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to create booking' }));
      }
    });
    return;
  }

  // POST /api/bookings/checkin - Verify QR Pass
  if (req.method === 'POST' && pathname === '/api/bookings/checkin') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { bookingId } = JSON.parse(body);
        const booking = bookings.find(b => b.id.toUpperCase() === (bookingId || '').toUpperCase());
        if (!booking) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid or unrecognized booking pass' }));
          return;
        }
        booking.status = 'Completed';
        saveData('bookings.json', bookings);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Tourist check-in verified!', booking }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed check-in request' }));
      }
    });
    return;
  }

  // GET /api/stats/summary - Overview stats
  if (req.method === 'GET' && pathname === '/api/stats/summary') {
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalDestinations: places.length,
      totalBookings: bookings.length,
      totalMarketplaceProducts: products.length,
      totalRevenueINR: totalRevenue,
      currency: 'INR (₹)'
    }));
    return;
  }

  // ----------------------------------------------------------------
  // STATIC FRONTEND SERVING
  // ----------------------------------------------------------------
  let relativePath = pathname === '/' ? 'index.html' : pathname;
  // Prevent directory traversal
  let safePath = path.normalize(relativePath).replace(/^(..[\/])+/, '');
  let filePath = path.join(FRONTEND_DIR, safePath);

  // Fallback to root index.html if not found in frontend
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '..', safePath);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found - TourisMart India');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
================================================================
   TourisMart India - Smart Local Tourism Business Portal
   Backend REST API & Frontend Server
================================================================
   * Server Running:  http://localhost:${PORT}
   * API Health:      http://localhost:${PORT}/api/health
   * Destinations:    http://localhost:${PORT}/api/places
   * Products:        http://localhost:${PORT}/api/products
   * Bookings:        http://localhost:${PORT}/api/bookings
   * Frontend Served: http://localhost:${PORT}/
================================================================
  `);
});
