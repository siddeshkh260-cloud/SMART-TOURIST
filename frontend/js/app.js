// ------------------------------------------
    // ALL INDIAN TOURIST PLACES & EXPERIENCES
    // ------------------------------------------
    let localBusinesses = window.initialPlaces || [];

    // let marketplaceProducts = window.initialProducts || [];

    // Bookings state
    let userBookings = window.initialBookings || [];

    let cart = [];
    let currentActiveBookingBiz = null;
    let selectedCategory = 'all';
    let currentAuthMode = 'signin';
    let currentRole = 'tourist';
    let html5QrScanner = null;

    document.addEventListener('DOMContentLoaded', () => {
      renderBusinesses(localBusinesses);
      renderMarketplace();
      renderBookings();
      renderHostDashboard();
      initCharts();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    function switchNavTab(tabName) {
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });

      document.querySelectorAll('.view-container').forEach(view => {
        view.classList.remove('active');
      });

      const targetView = document.getElementById(`view-${tabName}`);
      if (targetView) {
        targetView.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function changeRole(role) {
      currentRole = role;
      showToast(`Switched view to ${role.toUpperCase()}`, 'check-circle');
      if (role === 'vendor') switchNavTab('vendor');
      else if (role === 'admin') switchNavTab('admin');
      else switchNavTab('explore');
    }

    function filterByStateName(stateName) {
      switchNavTab('explore');
      const filter = document.getElementById('region-filter');
      if (filter) {
        filter.value = stateName;
        filterBusinesses();
      }
    }

    // ------------------------------------------
    // RENDER BUSINESSES
    // ------------------------------------------
    function renderBusinesses(items) {
      const grid = document.getElementById('businessesGrid');
      const countEl = document.getElementById('businessCountText');
      if (countEl) countEl.innerText = `Showing ${items.length} Indian destinations`;

      if (!items.length) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--gray-300);">
            <i data-lucide="compass" style="width: 48px; height: 48px; color: var(--gray-400); margin-bottom: 1rem;"></i>
            <h3>No destinations match this state or filter</h3>
            <p style="color: var(--gray-600); margin-top: 0.5rem;">Select another Indian state or clear your search terms.</p>
          </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
      }

      grid.innerHTML = items.map(biz => `
        <div class="biz-card">
          <div class="biz-card-image">
            <img src="${biz.image}" alt="${biz.title}" loading="lazy">
            <div class="biz-badge-eco">
              <i data-lucide="leaf" style="width: 12px; height: 12px;"></i> ${biz.ecoTag}
            </div>
            <div class="biz-badge-state">
              ${biz.region}
            </div>
          </div>
          <div class="biz-card-body">
            <div class="biz-card-meta">
              <span class="biz-location">
                <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${biz.location}
              </span>
              <span class="biz-rating">
                <i data-lucide="star" style="width: 14px; height: 14px; fill: currentColor;"></i> ${biz.rating} (${biz.reviewsCount})
              </span>
            </div>
            <h3 class="biz-title">${biz.title}</h3>
            <p class="biz-desc">${biz.description}</p>
            <div class="biz-card-footer">
              <div class="biz-price">
                <span class="biz-price-label">Direct Rate</span>
                <span class="biz-price-value">₹${biz.price.toLocaleString('en-IN')} <span style="font-size: 0.75rem; font-weight: 500; color: var(--gray-500);">/ ${biz.priceUnit}</span></span>
              </div>
              <button class="btn-primary btn-sm" onclick="openBookingModal('${biz.id}')">
                <i data-lucide="calendar" style="width: 14px; height: 14px;"></i> Reserve
              </button>
            </div>
          </div>
        </div>
      `).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function filterByCategory(cat, btn) {
      selectedCategory = cat;
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      filterBusinesses();
    }

    function filterBusinesses() {
      const search = (document.getElementById('explore-search-input')?.value || '').toLowerCase().trim();
      const region = document.getElementById('region-filter')?.value || 'all';
      const budget = document.getElementById('budget-filter')?.value || 'all';

      const filtered = localBusinesses.filter(biz => {
        const matchesCategory = (selectedCategory === 'all' || biz.category === selectedCategory);
        const matchesSearch = !search || biz.title.toLowerCase().includes(search) || biz.description.toLowerCase().includes(search) || biz.location.toLowerCase().includes(search) || biz.region.toLowerCase().includes(search);
        const matchesRegion = (region === 'all' || biz.region === region);
        const matchesBudget = (budget === 'all' || biz.price <= parseFloat(budget));
        return matchesCategory && matchesSearch && matchesRegion && matchesBudget;
      });

      renderBusinesses(filtered);
    }

    // ------------------------------------------
    // BOOKINGS & QR PASS
    // ------------------------------------------
    function openBookingModal(bizId) {
      const biz = localBusinesses.find(b => b.id === bizId);
      if (!biz) return;
      currentActiveBookingBiz = biz;

      document.getElementById('bookingModalTitle').innerText = `Reserve: ${biz.title}`;
      document.getElementById('bookingModalBizName').innerText = `${biz.title} (${biz.region})`;
      document.getElementById('bookingModalPrice').innerText = `₹${biz.price.toLocaleString('en-IN')} / ${biz.priceUnit}`;
      document.getElementById('bookingModalImg').src = biz.image;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('bookDate').value = tomorrow.toISOString().split('T')[0];
      document.getElementById('bookGuests').value = 2;

      calculateBookingTotal();
      document.getElementById('bookingModal').classList.add('active');
    }

    function calculateBookingTotal() {
      if (!currentActiveBookingBiz) return;
      const guests = parseInt(document.getElementById('bookGuests').value || '1', 10);
      const total = currentActiveBookingBiz.price * guests;
      document.getElementById('bookingModalTotalPrice').innerText = `₹${total.toLocaleString('en-IN')}`;
    }

    function confirmBooking(e) {
      e.preventDefault();
      if (!currentActiveBookingBiz) return;

      const name = document.getElementById('bookGuestName').value.trim();
      const email = document.getElementById('bookGuestEmail').value.trim();
      const date = document.getElementById('bookDate').value;
      const guests = parseInt(document.getElementById('bookGuests').value, 10);
      const total = currentActiveBookingBiz.price * guests;
      const bookingCode = `TOUR-IND-${Math.floor(1000 + Math.random() * 9000)}`;

      const newBooking = {
        id: bookingCode,
        bizId: currentActiveBookingBiz.id,
        bizName: currentActiveBookingBiz.title,
        guestName: name,
        guestEmail: email,
        date: date,
        guests: guests,
        totalPrice: total,
        status: 'Confirmed',
        time: 'Check-in 11:00 AM'
      };

      userBookings.unshift(newBooking);
      closeModal('bookingModal');
      renderBookings();
      renderHostDashboard();

      if (window._firebase && window._firebase.db && window.currentUser) {
        try {
          const fb = window._firebase;
          fb.setDoc(fb.doc(fb.db, 'bookings', bookingCode), {
            ...newBooking,
            userId: window.currentUser.uid,
            createdAt: new Date().toISOString()
          });
        } catch(err) {
          console.log("Offline write fallback:", err);
        }
      }

      showToast(`Reservation confirmed for ${name}! QR Pass generated.`, 'check-circle');
      openQRPassModal(newBooking.id);
    }

    function openQRPassModal(bookingId) {
      const booking = userBookings.find(b => b.id === bookingId);
      if (!booking) return;

      document.getElementById('passModalBizName').innerText = booking.bizName;
      document.getElementById('passModalGuestInfo').innerText = `Traveler: ${booking.guestName} • ${booking.guests} Guests • Date: ${booking.date}`;
      document.getElementById('passBookingCode').innerText = booking.id;

      const qrContainer = document.getElementById('qrCodeContainer');
      qrContainer.innerHTML = '';

      if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
          text: JSON.stringify({
            bookingId: booking.id,
            biz: booking.bizName,
            name: booking.guestName,
            guests: booking.guests,
            date: booking.date,
            country: 'India',
            status: 'VERIFIED_INDIAN_PASS'
          }),
          width: 180,
          height: 180,
          colorDark: "#064e3b",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      }

      document.getElementById('qrPassModal').classList.add('active');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderBookings() {
      const container = document.getElementById('bookingsListContainer');
      if (!container) return;

      if (!userBookings.length) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: white; border-radius: var(--radius-xl); border: 1px dashed var(--gray-300);">
            <i data-lucide="ticket" style="width: 48px; height: 48px; color: var(--gray-400); margin-bottom: 1rem;"></i>
            <h3>No Bookings Yet</h3>
            <p style="color: var(--gray-600); margin-top: 0.5rem;">Explore authentic Indian homestays and safari experiences to reserve your pass.</p>
          </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
      }

      container.innerHTML = userBookings.map(b => `
        <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--gray-200); padding: 1.5rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-sm);">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
              <span class="status-pill ${b.status === 'Confirmed' ? 'status-confirmed' : 'status-completed'}">${b.status}</span>
              <span style="font-family: monospace; font-weight: 700; font-size: 0.85rem; color: var(--gray-500);">${b.id}</span>
            </div>
            <h3 style="font-size: 1.2rem; color: var(--gray-900); margin-bottom: 0.25rem;">${b.bizName}</h3>
            <p style="font-size: 0.85rem; color: var(--gray-600);">
              <i data-lucide="calendar" style="width: 14px; height: 14px; display: inline;"></i> ${b.date} • ${b.guests} Guests • <strong>₹${b.totalPrice.toLocaleString('en-IN')} Paid to Host</strong>
            </p>
          </div>
          <div>
            <button class="btn-primary btn-sm" onclick="openQRPassModal('${b.id}')">
              <i data-lucide="qr-code" style="width: 14px; height: 14px;"></i> View Digital QR Pass
            </button>
          </div>
        </div>
      `).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ------------------------------------------
    // MARKETPLACE & CART
    // ------------------------------------------
    function renderMarketplace() {
      const grid = document.getElementById('productsGrid');
      if (!grid) return;

      grid.innerHTML = marketplaceProducts.map(p => `
        <div class="product-card">
          <div class="product-img">
            <img src="${p.image}" alt="${p.name}">
          </div>
          <div class="product-body">
            <span class="artisan-tag">
              <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i> ${p.maker}
            </span>
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.35rem;">${p.name}</h4>
            <p style="font-size: 0.8rem; color: var(--gray-600); margin-bottom: 0.75rem; flex: 1;">${p.desc}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--gray-100); padding-top: 0.75rem; margin-top: auto;">
              <span style="font-size: 1.15rem; font-weight: 800; color: var(--primary-dark); font-family: var(--font-display);">₹${p.price.toLocaleString('en-IN')}</span>
              <button class="btn-primary btn-sm" onclick="addToCart('${p.id}')">
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add to Cart
              </button>
            </div>
          </div>
        </div>
      `).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function addToCart(prodId) {
      const prod = marketplaceProducts.find(p => p.id === prodId);
      if (!prod) return;

      const existing = cart.find(item => item.id === prodId);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ ...prod, qty: 1 });
      }

      updateCartUI();
      showToast(`Added ${prod.name} to cart!`, 'shopping-bag');
    }

    function updateCartUI() {
      const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
      const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

      document.getElementById('cartCountBadge').innerText = totalCount;
      document.getElementById('cartSubtotalBtn').innerText = `₹${totalPrice.toLocaleString('en-IN')}`;
      document.getElementById('cartDrawerTotal').innerText = `₹${totalPrice.toLocaleString('en-IN')}`;

      const listContainer = document.getElementById('cartItemsList');
      if (!cart.length) {
        listContainer.innerHTML = `<p style="color: var(--gray-500); text-align: center; margin-top: 2rem;">Your cart is empty.</p>`;
        return;
      }

      listContainer.innerHTML = cart.map(item => `
        <div style="display: flex; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--gray-100); align-items: center;">
          <img src="${item.image}" style="width: 50px; height: 50px; border-radius: var(--radius-sm); object-fit: cover;">
          <div style="flex: 1;">
            <h5 style="font-size: 0.85rem; font-weight: 700; line-height: 1.2;">${item.name}</h5>
            <span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 600;">₹${item.price.toLocaleString('en-IN')} each</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <button class="btn-outline btn-sm" style="padding: 0.2rem 0.5rem;" onclick="changeCartQty('${item.id}', -1)">-</button>
            <span style="font-weight: 700; font-size: 0.85rem;">${item.qty}</span>
            <button class="btn-outline btn-sm" style="padding: 0.2rem 0.5rem;" onclick="changeCartQty('${item.id}', 1)">+</button>
          </div>
        </div>
      `).join('');
    }

    function changeCartQty(id, delta) {
      const item = cart.find(i => i.id === id);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
      updateCartUI();
    }

    function toggleCartDrawer() {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartOverlay');
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        drawer.classList.remove('open');
        overlay.style.display = 'none';
      } else {
        drawer.classList.add('open');
        overlay.style.display = 'block';
      }
    }

    function checkoutCart() {
      if (!cart.length) {
        showToast('Cart is empty', 'alert-circle');
        return;
      }
      showToast('Order confirmed! 100% direct payment channeled to Indian artisans.', 'check-circle');
      cart = [];
      updateCartUI();
      toggleCartDrawer();
    }

    // ------------------------------------------
    // SMART ITINERARY PLANNER
    // ------------------------------------------
    function generateSmartItinerary() {
      const days = document.getElementById('itinerary-days').value;
      const theme = document.getElementById('itinerary-theme').value;
      const output = document.getElementById('itineraryOutput');

      let day1Title = "Day 1: Royal Heritage & Artisan Immersion (Rajasthan Circuit)";
      let day2Title = "Day 2: Desert Forts, Stepwells & Sand Dune Camp";

      if (theme === 'nature') {
        day1Title = "Day 1: Alleppey Palm Canals & Paddy Fields (Kerala Circuit)";
        day2Title = "Day 2: Munnar Tea Hills, Cardamom Trails & Kathakali";
      } else if (theme === 'himalayas') {
        day1Title = "Day 1: Rishikesh Holy Ganga Rafting & Parmarth Aarti";
        day2Title = "Day 2: Old Manali Apple Orchards & Pine Forest Chalet";
      } else if (theme === 'south') {
        day1Title = "Day 1: Hampi Vijayanagara Boulder Ruins & Coracle";
        day2Title = "Day 2: Coorg Rainforest Coffee Plantation & Spices";
      }

      output.innerHTML = `
        <div class="itinerary-day-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--gray-100); padding-bottom: 0.75rem;">
            <h3 style="font-size: 1.25rem; color: var(--primary-dark);">${day1Title}</h3>
            <span class="status-pill status-confirmed">Verified Indian Trail</span>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--gray-500);">08:30 AM — Morning Heritage Immersion</span>
              <h4 style="font-size: 1.05rem; margin: 0.2rem 0;">Subah-e-Banaras Dawn Heritage Boat & Silk Weaving</h4>
              <p style="font-size: 0.85rem; color: var(--gray-600);">Row past stone ghats at sunrise with live morning ragas, then visit generational silk weavers.</p>
              <button class="btn-outline btn-sm" style="margin-top: 0.5rem;" onclick="openBookingModal('ind_10')">Reserve (₹1,200)</button>
            </div>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--gray-500);">02:00 PM — GI Craft Masterclass</span>
              <h4 style="font-size: 1.05rem; margin: 0.2rem 0;">Jaipur Blue Pottery & Gemstone Artisan Workshop</h4>
              <p style="font-size: 0.85rem; color: var(--gray-600);">Sit with master artisans to shape ground quartz plates with cobalt floral motifs.</p>
              <button class="btn-outline btn-sm" style="margin-top: 0.5rem;" onclick="openBookingModal('ind_20')">Reserve (₹1,850)</button>
            </div>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--gray-500);">06:30 PM — Starlit Heritage Stay</span>
              <h4 style="font-size: 1.05rem; margin: 0.2rem 0;">Desert Dune Eco-Camp & Kalbelia Folk Night</h4>
              <p style="font-size: 0.85rem; color: var(--gray-600);">Traditional Swiss tents under the desert stars with authentic Dal Baati Churma feast.</p>
              <button class="btn-primary btn-sm" style="margin-top: 0.5rem;" onclick="openBookingModal('ind_1')">Book Camp (₹3,800)</button>
            </div>
          </div>
        </div>

        ${days > 1 ? `
        <div class="itinerary-day-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--gray-100); padding-bottom: 0.75rem;">
            <h3 style="font-size: 1.25rem; color: var(--primary-dark);">${day2Title}</h3>
            <span class="status-pill status-confirmed">Green Eco-Trail</span>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--gray-500);">09:00 AM — Nature & Waterway Expedition</span>
              <h4 style="font-size: 1.05rem; margin: 0.2rem 0;">Alleppey Backwater Eco-Houseboat & Village Canoe</h4>
              <p style="font-size: 0.85rem; color: var(--gray-600);">Glide through palm canals and visit native toddy groves and paddy fields.</p>
              <button class="btn-outline btn-sm" style="margin-top: 0.5rem;" onclick="openBookingModal('ind_2')">Reserve (₹5,500)</button>
            </div>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--gray-500);">05:00 PM — Culinary Spice Trail</span>
              <h4 style="font-size: 1.05rem; margin: 0.2rem 0;">Chettinad Heritage Mansion Walk & 18-Spice Feast</h4>
              <p style="font-size: 0.85rem; color: var(--gray-600);">Hands-on stone-grinding session for authentic Chettinad pepper specialties.</p>
              <button class="btn-primary btn-sm" style="margin-top: 0.5rem;" onclick="openBookingModal('ind_11')">Join Trail (₹1,950)</button>
            </div>
          </div>
        </div>
        ` : ''}
      `;

      showToast('Smart Indian Circuit Itinerary generated!', 'sparkles');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ------------------------------------------
    // HOST DASHBOARD
    // ------------------------------------------
    function renderHostDashboard() {
      const tbody = document.getElementById('hostBookingsTableBody');
      if (tbody) {
        tbody.innerHTML = userBookings.map(b => `
          <tr>
            <td><strong>${b.id}</strong></td>
            <td>${b.guestName}</td>
            <td>${b.bizName}</td>
            <td>${b.date}</td>
            <td>${b.guests} Guests</td>
            <td><strong>₹${b.totalPrice.toLocaleString('en-IN')}</strong></td>
            <td><span class="status-pill ${b.status === 'Confirmed' ? 'status-confirmed' : 'status-completed'}">${b.status}</span></td>
            <td>
              ${b.status === 'Confirmed' 
                ? `<button class="btn-primary btn-sm" onclick="checkInGuest('${b.id}')"><i data-lucide="check" style="width: 12px; height: 12px;"></i> Check In</button>`
                : `<span style="font-size: 0.8rem; color: var(--gray-500);">Completed</span>`}
            </td>
          </tr>
        `).join('');
      }

      const hostGrid = document.getElementById('hostListingsGrid');
      if (hostGrid) {
        const hostItems = localBusinesses.slice(0, 3);
        hostGrid.innerHTML = hostItems.map(b => `
          <div class="biz-card">
            <div class="biz-card-image" style="height: 160px;">
              <img src="${b.image}" alt="${b.title}">
            </div>
            <div class="biz-card-body">
              <h4 style="font-size: 1.05rem; font-weight: 700;">${b.title}</h4>
              <p style="font-size: 0.8rem; color: var(--gray-600); margin: 0.35rem 0;">${b.location} • ₹${b.price.toLocaleString('en-IN')} / ${b.priceUnit}</p>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <button class="btn-outline btn-sm" style="flex: 1;" onclick="showToast('Listing settings updated', 'check')">Edit Listing</button>
                <button class="btn-primary btn-sm" style="flex: 1;" onclick="showToast('Active & Receiving Bookings', 'check')">Available</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    function checkInGuest(bookingId) {
      const b = userBookings.find(item => item.id === bookingId);
      if (b) {
        b.status = 'Completed';
        renderBookings();
        renderHostDashboard();
        showToast(`Traveler ${b.guestName} successfully verified and checked in!`, 'check-circle');
      }
    }

    function openAddListingModal() {
      document.getElementById('addListingModal').classList.add('active');
    }

    function submitNewListing(e) {
      e.preventDefault();
      const state = document.getElementById('newBizState').value;
      const newListing = {
        id: `ind_${Date.now()}`,
        title: document.getElementById('newBizTitle').value.trim(),
        category: document.getElementById('newBizCategory').value,
        region: state,
        location: document.getElementById('newBizLocation').value.trim(),
        price: parseFloat(document.getElementById('newBizPrice').value),
        priceUnit: 'experience',
        rating: 5.0,
        reviewsCount: 1,
        image: document.getElementById('newBizImg').value.trim() || 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
        ecoTag: 'Verified State Host',
        description: document.getElementById('newBizDesc').value.trim()
      };

      localBusinesses.unshift(newListing);
      renderBusinesses(localBusinesses);
      renderHostDashboard();
      closeModal('addListingModal');
      showToast('New Indian destination listing published!', 'check-circle');

      if (window._firebase && window._firebase.db) {
        try {
          const fb = window._firebase;
          fb.setDoc(fb.doc(fb.db, 'businesses', newListing.id), newListing);
        } catch(err) {
          console.log("Firestore offline write:", err);
        }
      }
    }

    // ------------------------------------------
    // SCANNER
    // ------------------------------------------
    function openScannerModal() {
      document.getElementById('scannerModal').classList.add('active');
      if (typeof Html5Qrcode !== 'undefined') {
        try {
          html5QrScanner = new Html5Qrcode("scannerReader");
          html5QrScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => handleQrScanSuccess(decodedText),
            () => {}
          ).catch(err => {
            console.log("Camera access not available, manual entry ready.", err);
          });
        } catch(e) {}
      }
    }

    function closeScannerModal() {
      if (html5QrScanner) {
        try {
          html5QrScanner.stop().then(() => html5QrScanner.clear()).catch(() => {});
        } catch(e){}
      }
      closeModal('scannerModal');
    }

    function handleQrScanSuccess(decodedText) {
      closeScannerModal();
      try {
        const data = JSON.parse(decodedText);
        if (data.bookingId) {
          checkInGuest(data.bookingId);
          showToast(`Pass Validated: ${data.name} (${data.guests} Guests)`, 'check-circle');
          return;
        }
      } catch(e) {}
      showToast(`Scanned Code: ${decodedText}`, 'check-circle');
    }

    function verifyManualCode() {
      const code = document.getElementById('manualCodeInput').value.trim().toUpperCase();
      const booking = userBookings.find(b => b.id.toUpperCase() === code);
      if (booking) {
        checkInGuest(booking.id);
        closeScannerModal();
      } else {
        showToast('Invalid or unrecognized booking code', 'alert-circle');
      }
    }

    // ------------------------------------------
    // CHARTS
    // ------------------------------------------
    function initCharts() {
      if (typeof Chart === 'undefined') return;

      const ctx1 = document.getElementById('hostBookingsChart')?.getContext('2d');
      if (ctx1) {
        new Chart(ctx1, {
          type: 'line',
          data: {
            labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
            datasets: [{
              label: 'Indian & Global Travelers',
              data: [45, 68, 59, 84, 112, 164],
              borderColor: '#059669',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              fill: true,
              tension: 0.35,
              borderWidth: 3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
          }
        });
      }

      const ctx2 = document.getElementById('hostDemographicsChart')?.getContext('2d');
      if (ctx2) {
        new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: ['Domestic Interstate', 'International Heritage', 'Local State Weekend'],
            datasets: [{
              data: [65, 22, 13],
              backgroundColor: ['#059669', '#f97316', '#3b82f6']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }

      const ctx3 = document.getElementById('adminRevenueChart')?.getContext('2d');
      if (ctx3) {
        new Chart(ctx3, {
          type: 'bar',
          data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
              label: 'State Tourism Impact (₹ Crore)',
              data: [68, 92, 115, 153],
              backgroundColor: '#10b981',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
          }
        });
      }

      const ctx4 = document.getElementById('adminCategoryChart')?.getContext('2d');
      if (ctx4) {
        new Chart(ctx4, {
          type: 'pie',
          data: {
            labels: ['North (Himalayas & Rajasthan)', 'South (Kerala, TN & Karnataka)', 'West (Goa & Gujarat)', 'East & Northeast'],
            datasets: [{
              data: [38, 32, 18, 12],
              backgroundColor: ['#f97316', '#059669', '#3b82f6', '#8b5cf6']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }
    }

    // ------------------------------------------
    // FIREBASE AUTH
    // ------------------------------------------
    function openAuthModal(mode) {
      currentAuthMode = mode;
      const title = document.getElementById('authModalTitle');
      const submitBtn = document.getElementById('authSubmitBtn');
      const roleGroup = document.getElementById('roleSelectGroup');
      const toggleLink = document.getElementById('authToggleLink');
      const togglePrompt = document.getElementById('authTogglePrompt');

      if (mode === 'signup') {
        title.innerText = 'Join TourisMart India';
        submitBtn.innerText = 'Create Account with Firebase';
        roleGroup.style.display = 'block';
        toggleLink.innerText = 'Sign In';
        togglePrompt.innerText = 'Already have an account?';
      } else {
        title.innerText = 'Sign In to TourisMart India';
        submitBtn.innerText = 'Sign In with Firebase';
        roleGroup.style.display = 'none';
        toggleLink.innerText = 'Sign Up';
        togglePrompt.innerText = "Don't have an account?";
      }

      document.getElementById('authModal').classList.add('active');
    }

    function toggleAuthMode() {
      openAuthModal(currentAuthMode === 'signin' ? 'signup' : 'signin');
    }

    async function handleAuthSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const role = document.getElementById('authRole').value;

      const fb = window._firebase;
      if (!fb || !fb.auth) {
        simulateAuthSuccess({ email, uid: 'local_uid_' + Date.now() }, role);
        return;
      }

      try {
        if (currentAuthMode === 'signup') {
          const cred = await fb.createUserWithEmailAndPassword(fb.auth, email, password);
          try {
            await fb.setDoc(fb.doc(fb.db, 'users', cred.user.uid), {
              email: email,
              role: role,
              createdAt: new Date().toISOString()
            });
          } catch(e) {}
          simulateAuthSuccess(cred.user, role);
        } else {
          const cred = await fb.signInWithEmailAndPassword(fb.auth, email, password);
          simulateAuthSuccess(cred.user, role);
        }
      } catch(err) {
        console.error("Firebase auth error:", err);
        showToast(err.message || 'Authentication error', 'alert-circle');
      }
    }

    async function signInWithGooglePopup() {
      const fb = window._firebase;
      if (!fb || !fb.auth || !fb.googleProvider) {
        simulateAuthSuccess({ displayName: 'Google Traveler', email: 'traveler@google.com', uid: 'google_local' }, 'tourist');
        return;
      }

      try {
        const cred = await fb.signInWithPopup(fb.auth, fb.googleProvider);
        simulateAuthSuccess(cred.user, 'tourist');
      } catch(err) {
        console.error("Google sign in error:", err);
        showToast(err.message || 'Google sign in cancelled', 'alert-circle');
      }
    }

    function simulateAuthSuccess(user, role) {
      window.currentUser = user;
      window.currentUserRole = role;
      closeModal('authModal');
      showToast(`Namaste & Welcome, ${user.displayName || user.email}!`, 'check-circle');

      const authContainer = document.getElementById('authBtnContainer');
      authContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">
            ${(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <button class="btn-outline btn-sm" onclick="signOutUser()">
            <i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Sign Out
          </button>
        </div>
      `;

      if (document.getElementById('roleSelector')) {
        document.getElementById('roleSelector').value = role;
      }
      changeRole(role);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function signOutUser() {
      const fb = window._firebase;
      if (fb && fb.auth) fb.signOut(fb.auth);
      window.currentUser = null;
      window.currentUserRole = null;
      document.getElementById('authBtnContainer').innerHTML = `
        <button class="btn-primary" onclick="openAuthModal('signin')">
          <i data-lucide="user" style="width: 16px; height: 16px;"></i> Sign In / Firebase
        </button>
      `;
      changeRole('tourist');
      showToast('Signed out successfully.', 'check');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    window.handleUserAuthenticated = function(user, role) {
      simulateAuthSuccess(user, role);
    };

    window.handleUserSignedOut = function() {};

    function closeModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.remove('active');
    }

    function showToast(msg, icon = 'info') {
      const toast = document.getElementById('toastNotice');
      const text = document.getElementById('toastMessage');
      if (toast && text) {
        text.innerText = msg;
        toast.classList.add('active');
        clearTimeout(window._toastTimeout);
        window._toastTimeout = setTimeout(() => {
          toast.classList.remove('active');
        }, 3500);
      }
    }

// Optional Backend API sync: Fetch latest destinations from backend if available
async function loadPlacesFromAPI() {
  try {
    const res = await fetch('/api/places');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        localBusinesses = data;
        renderBusinesses(localBusinesses);
      }
    }
  } catch(e) {
    // Backend offline; using local mock dataset smoothly
  }
}
loadPlacesFromAPI();
