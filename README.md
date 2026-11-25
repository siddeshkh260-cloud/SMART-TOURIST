# SMART-TOURIST18

## TourisMart India — Smart Local Tourism Business Portal

A full-stack ecosystem empowering local tourism micro-businesses, heritage homestays, and indigenous GI artisans across every state of India with zero-commission direct bookings.

---

### Project Architecture (Frontend & Backend)

```text
smart/
├── backend/
│   ├── server.js               # Node.js REST API & static file server (Zero external dependencies)
│   └── data/
│       ├── places.json         # 53 Famous Indian destinations across all states & UTs
│       ├── products.json       # Authentic Indian GI-tagged handicrafts & produce
│       └── bookings.json       # Real-time traveler reservations & QR digital passes
├── frontend/
│   ├── index.html              # Clean semantic frontend markup (Mobile-responsive UI)
│   ├── css/
│   │   └── styles.css          # Modern design system (Glassmorphism, emerald/saffron Indian theme)
│   └── js/
│       ├── firebase-config.js  # Firebase Auth & Firestore client integration
│       ├── data.js             # Initial Indian dataset & offline fallback
│       └── app.js              # UI controller, QR generator, camera scanner, charts & cart
├── index.html                  # Standalone portal root (for 1-click GitHub Pages deployment)
├── package.json                # Project startup scripts & configuration
└── README.md                   # Full-stack documentation
```

---

### How to Run in Antigravity

#### 1. Running the Backend Server
Start the Node.js backend server directly from the project root:

```bash
npm start
# or
node backend/server.js
```

The server will be running at:
- **Web App**: `http://localhost:3000/`
- **API Health**: `http://localhost:3000/api/health`
- **Destinations API**: `http://localhost:3000/api/places`
- **Indian GI Products API**: `http://localhost:3000/api/products`
- **Bookings API**: `http://localhost:3000/api/bookings`
- **Macro Analytics API**: `http://localhost:3000/api/stats/summary`

#### 2. Running / Viewing the Frontend
- **Via Backend Server**: Open `http://localhost:3000` in your browser.
- **Direct Browser / Live Server**: You can also open `frontend/index.html` directly in any modern browser.
- **GitHub Pages**: The project includes a synchronized root `index.html` allowing zero-configuration hosting on GitHub Pages:  
  **https://siddeshkh260-cloud.github.io/SMART-TOURIST18/**

---

### Backend REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status of the API server |
| `GET` | `/api/places` | List all 53 Indian destinations (supports `?state=`, `?category=`, `?search=`, `?maxPrice=`) |
| `GET` | `/api/places/:id` | Get details of a single tourist destination |
| `POST` | `/api/places` | Add a new Indian business listing (Host Portal) |
| `GET` | `/api/products` | Retrieve authentic Indian GI handicrafts |
| `GET` | `/api/bookings` | Retrieve customer reservations |
| `POST` | `/api/bookings` | Create reservation & generate digital QR Pass |
| `POST` | `/api/bookings/checkin` | Verify tourist QR pass code at the host door |
| `GET` | `/api/stats/summary` | Macro tourism metrics & revenue stats in ₹ INR |

---

### Key Features
- **Tourist Explorer**: 53 famous places across all 28 states & UTs with state filter and ₹ INR pricing.
- **Dynamic QR Code Pass**: Paperless traveler pass generated with `qrcode.js`.
- **Host Pass Scanner**: Camera QR code scanning using `html5-qrcode` and manual code verification.
- **Smart AI Itinerary**: Custom trip planner across iconic Indian travel circuits.
- **Indian GI Crafts Marketplace**: E-commerce cart for authentic regional produce.
- **Firebase Auth & Firestore**: Live authentication with local fallback.
