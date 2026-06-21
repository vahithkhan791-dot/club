import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { 
  UserRole, BookingStatus, PaymentStatus, NotificationType, 
  Booking, Payment, Review, Notification, Venue, Court, Slot 
} from './src/types';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper: Simple session-less auth from client mock headers/session info
  // For reliable demonstration in preview context, we read "Authorization: User <userId>"
  const getCurrentUser = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Simulating simple JWT payload extraction: token is simply the userId in preview
      return db.users.get(token);
    }
    return undefined;
  };

  // ----------------------------------------------------
  // AI INTEGRATION: Google GenAI (Gemini 3.5 Flash)
  // ----------------------------------------------------
  const getAiHelper = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return null;
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // --- Auth APIs ---
  app.post('/api/auth/register', (req, res) => {
    const { email, name, password, role } = req.body;
    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Missing registration details' });
    }

    // Check pre-existing email
    const existing = Array.from(db.users.values()).find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      email,
      name,
      role: role as UserRole,
      isApproved: role !== UserRole.OWNER, // Owners need Admin approval, customers/admins automatic
      createdAt: new Date().toISOString()
    };

    db.users.set(newUser.id, newUser);
    res.json({ message: 'Registration successful', user: newUser });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = Array.from(db.users.values()).find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'User not found. Try registering or use default seeds.' });
    }

    res.json({ 
      message: 'Logged in successfully', 
      token: user.id, // Simulating a bearer token string (simply the user ID for frictionless playground use)
      user 
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ user });
  });

  // --- Sport APIs ---
  app.get('/api/sports', (req, res) => {
    res.json(Array.from(db.sports.values()));
  });

  // --- Venue APIs ---
  app.get('/api/venues', (req, res) => {
    const { city, sportId, query, minPrice, maxPrice } = req.query;
    
    let list = Array.from(db.venues.values()).filter(v => v.isApproved);

    // Apply filters
    if (city) {
      list = list.filter(v => v.city.toLowerCase() === (city as string).toLowerCase());
    }
    if (query) {
      const q = (query as string).toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
    }
    if (sportId) {
      // Find courts offering this sport id, map back to venue
      const matchingCoutVenueIds = Array.from(db.courts.values())
        .filter(c => c.sportId === sportId)
        .map(c => c.venueId);
      list = list.filter(v => matchingCoutVenueIds.includes(v.id));
    }
    if (minPrice) {
      list = list.filter(v => v.priceMin >= Number(minPrice));
    }
    if (maxPrice) {
      list = list.filter(v => v.priceMin <= Number(maxPrice));
    }

    res.json(list);
  });

  // Venue details with associated courts
  app.get('/api/venues/:id', (req, res) => {
    const { id } = req.params;
    const venue = db.venues.get(id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Embed associated courts and reviews
    const courtsList = Array.from(db.courts.values()).filter(c => c.venueId === id);
    const reviewsList = Array.from(db.reviews.values()).filter(r => r.venueId === id);

    res.json({
      ...venue,
      courts: courtsList,
      reviews: reviewsList
    });
  });

  // Management endpoints
  app.get('/api/owner/venues', (req, res) => {
    const user = getCurrentUser(req);
    if (!user || (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Admins see all, Owners see their registered venues
    const list = Array.from(db.venues.values());
    const filtered = user.role === UserRole.ADMIN ? list : list.filter(v => v.ownerId === user.id);
    res.json(filtered);
  });

  app.post('/api/venues', (req, res) => {
    const user = getCurrentUser(req);
    if (!user || (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, description, address, city, latitude, longitude, facilities, priceMin, imageUrls } = req.body;
    if (!name || !description || !address || !city) {
      return res.status(400).json({ error: 'Missing arena specifications' });
    }

    const newVenue: Venue = {
      id: `v_${Date.now()}`,
      ownerId: user.id,
      name,
      description,
      address,
      city,
      latitude: latitude ? Number(latitude) : 12.9716,
      longitude: longitude ? Number(longitude) : 77.5946,
      facilities: facilities || [],
      rating: 5.0,
      reviewCount: 0,
      priceMin: priceMin ? Number(priceMin) : 500,
      imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=600'],
      isApproved: user.role === UserRole.ADMIN, // Admin registrations auto-approved, owners need admin onay
      createdAt: new Date().toISOString()
    };

    db.venues.set(newVenue.id, newVenue);
    res.json({ message: 'Venue created successfully', venue: newVenue });
  });

  // Admin approvals & triggers
  app.post('/api/admin/venues/:id/approve', (req, res) => {
    const user = getCurrentUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Administrative privileges required.' });
    }

    const venue = db.venues.get(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    venue.isApproved = true;
    db.venues.set(venue.id, venue);

    // Notify venue owner
    const notifyId = `not_${Date.now()}`;
    db.notifications.set(notifyId, {
      id: notifyId,
      userId: venue.ownerId,
      title: 'Arena Approved!',
      message: `Your sports arena "${venue.name}" is approved by SportSphere Admins. It is now live for open slots booking!`,
      isRead: false,
      type: NotificationType.SYSTEM,
      createdAt: new Date().toISOString()
    });

    res.json({ message: 'Venue approved successfully', venue });
  });

  // Create courts as children of Venues
  app.post('/api/courts', (req, res) => {
    const user = getCurrentUser(req);
    if (!user || (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { venueId, sportId, name, pricePerHour } = req.body;
    if (!venueId || !sportId || !name || !pricePerHour) {
      return res.status(400).json({ error: 'Missing court properties' });
    }

    const newCourt: Court = {
      id: `c_${Date.now()}`,
      venueId,
      sportId,
      name,
      pricePerHour: Number(pricePerHour)
    };

    db.courts.set(newCourt.id, newCourt);

    // Dynamic generation of slots for the new court (next 7 days, 08:00 to 22:00)
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dateStr = targetDate.toISOString().split('T')[0];

      for (let hour = 8; hour < 22; hour++) {
        const startStr = `${hour.toString().padStart(2, '0')}:00`;
        const endStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
        const slotId = `slot_${newCourt.id}_${dateStr}_${hour}`;
        
        db.slots.set(slotId, {
          id: slotId,
          courtId: newCourt.id,
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          isBooked: false,
          price: newCourt.pricePerHour
        });
      }
    }

    res.json({ message: 'Court added and hourly slots generated successfully', court: newCourt });
  });

  // --- Real-time Slots Queries ---
  app.get('/api/slots', (req, res) => {
    const { courtId, venueId, sportId, date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Target query date YYYY-MM-DD required' });
    }

    let targetCourtIds: string[] = [];

    if (courtId) {
      targetCourtIds.push(courtId as string);
    } else if (venueId) {
      // Find all courts of this venue
      let venueCourts = Array.from(db.courts.values()).filter(c => c.venueId === venueId);
      if (sportId) {
        venueCourts = venueCourts.filter(c => c.sportId === sportId);
      }
      targetCourtIds = venueCourts.map(c => c.id);
    }

    // Match slot by dates or courts
    const results = Array.from(db.slots.values()).filter(s => {
      const dateMatches = s.date === date;
      const courtMatches = targetCourtIds.length === 0 || targetCourtIds.includes(s.courtId);
      return dateMatches && courtMatches;
    });

    res.json(results);
  });

  // --- Booking & Razorpay Simulative Payments ---
  app.post('/api/bookings', (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentic session token required for slot checks.' });
    }

    const { slotId } = req.body;
    if (!slotId) {
      return res.status(400).json({ error: 'Specified target Slot ID is required' });
    }

    const slot = db.slots.get(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Selected slot does not exist' });
    }

    if (slot.isBooked) {
      return res.status(422).json({ error: 'This time slot was just booked by another sportsperson! Please pick an adjacent slot.' });
    }

    const court = db.courts.get(slot.courtId);
    if (!court) {
      return res.status(500).json({ error: 'Internal schema anomaly: slot detached from valid Court.' });
    }

    const venue = db.venues.get(court.venueId);
    const sport = db.sports.get(court.sportId);

    // Mark slot as booked
    slot.isBooked = true;
    db.slots.set(slot.id, slot);

    const bookingId = `b_${Date.now()}`;
    const newBooking: Booking = {
      id: bookingId,
      userId: user.id,
      venueId: court.venueId,
      courtId: court.id,
      slotId: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      totalAmount: slot.price,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date().toISOString(),
      // Hydrated meta for frictionless UI
      venueName: venue?.name,
      courtName: court.name,
      sportName: sport?.name,
      userName: user.name
    };

    db.bookings.set(bookingId, newBooking);

    // Auto capture simulative Razorpay payment transaction
    const paymentId = `pay_${Date.now()}`;
    const newPayment: Payment = {
      id: paymentId,
      bookingId: bookingId,
      razorpayOrderId: `order_rzp_${Date.now()}`,
      razorpayPaymentId: `pay_rzp_${Date.now()}`,
      amount: slot.price,
      status: PaymentStatus.CAPTURED,
      createdAt: new Date().toISOString()
    };
    db.payments.set(paymentId, newPayment);

    // Notify Customer
    const notifyCustId = `not_${Date.now()}_c`;
    db.notifications.set(notifyCustId, {
      id: notifyCustId,
      userId: user.id,
      title: 'Booking Confirmed! 🎯',
      message: `Your booking for ${sport?.name || 'Sports'} at "${venue?.name}" (${court.name}) on ${slot.date} at ${slot.startTime} is confirmed. Payment of ₹${slot.price} captured via Razorpay successfully!`,
      isRead: false,
      type: NotificationType.BOOKING,
      createdAt: new Date().toISOString()
    });

    // Notify Venue Owner
    if (venue) {
      const notifyOwnId = `not_${Date.now()}_o`;
      db.notifications.set(notifyOwnId, {
        id: notifyOwnId,
        userId: venue.ownerId,
        title: 'New Booking Slot Received 💰',
        message: `Your arena "${venue.name}" received a new booking from ${user.name} on ${slot.date} (${slot.startTime} - ${slot.endTime}) yielding ₹${slot.price}.`,
        isRead: false,
        type: NotificationType.BOOKING,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ message: 'Booking confirmed and slot reserved.', booking: newBooking, payment: newPayment });
  });

  // Cancel Booking and process Simulative automatic Refund
  app.post('/api/bookings/:id/cancel', (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const booking = db.bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking transaction not found' });
    }

    // Role verification: user plays, owner runs the turf, admin controls everything
    const venue = db.venues.get(booking.venueId);
    const isOwner = venue?.ownerId === user.id;
    const isCustomerSelf = booking.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isCustomerSelf && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden. You do not own this booking ledger.' });
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return res.status(400).json({ error: 'This session slot is already marked as Cancelled.' });
    }

    // Mark slot as available again
    const slot = db.slots.get(booking.slotId);
    if (slot) {
      slot.isBooked = false;
      db.slots.set(slot.id, slot);
    }

    // Mark booking status as Cancelled
    booking.status = BookingStatus.CANCELLED;
    db.bookings.set(booking.id, booking);

    // Update payment status as Refunded
    const payment = Array.from(db.payments.values()).find(p => p.bookingId === booking.id);
    if (payment) {
      payment.status = PaymentStatus.REFUNDED;
      db.payments.set(payment.id, payment);
    }

    // Notify Customer about cancellations & refunds
    const notifyCustId = `not_cancel_${Date.now()}_c`;
    db.notifications.set(notifyCustId, {
      id: notifyCustId,
      userId: booking.userId,
      title: 'Booking Cancelled & Refund Initiated 🔄',
      message: `Your reservation at ${booking.venueName} on ${booking.date} (${booking.startTime}) is cancelled. Automatic instant refund of ₹${booking.totalAmount} was processed back to your digital wallet/bank account.`,
      isRead: false,
      type: NotificationType.CANCELLATION,
      createdAt: new Date().toISOString()
    });

    res.json({ message: 'Booking cancelled successfully, slot opened and refund disbursed.', booking });
  });

  // Query custom booking histories
  app.get('/api/bookings', (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const allBookings = Array.from(db.bookings.values());
    let list: Booking[] = [];

    if (user.role === UserRole.ADMIN) {
      list = allBookings; // admin sees all
    } else if (user.role === UserRole.OWNER) {
      // Owner sees all bookings for their specific venues
      const ownerVenueIds = Array.from(db.venues.values())
        .filter(v => v.ownerId === user.id)
        .map(v => v.id);
      list = allBookings.filter(b => ownerVenueIds.includes(b.venueId));
    } else {
      // customer sees their own playing book
      list = allBookings.filter(b => b.userId === user.id);
    }

    // Sort by most recent booking at top
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  });

  // --- Review & Ratings ---
  app.post('/api/reviews', (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Login required to submit sports reviews.' });
    }

    const { venueId, rating, comment } = req.body;
    if (!venueId || !rating || !comment) {
      return res.status(400).json({ error: 'Missing star-rating count or feedback comment.' });
    }

    const venue = db.venues.get(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Arena not found' });
    }

    const reviewId = `rev_${Date.now()}`;
    const newReview: Review = {
      id: reviewId,
      userId: user.id,
      venueId,
      userName: user.name,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString()
    };

    db.reviews.set(reviewId, newReview);

    // Recalculate venue rating average score
    const venueReviews = Array.from(db.reviews.values()).filter(r => r.venueId === venueId);
    const average = venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length;
    
    venue.rating = Number(average.toFixed(1));
    venue.reviewCount = venueReviews.length;
    db.venues.set(venue.id, venue);

    res.json({ message: 'Review committed successfully', review: newReview, venueRating: venue.rating });
  });

  // --- Notifications ---
  app.get('/api/notifications', (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userNotifs = Array.from(db.notifications.values())
      .filter(n => n.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(userNotifs);
  });

  app.post('/api/notifications/read', (req, res) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    Array.from(db.notifications.values())
      .filter(n => n.userId === user.id)
      .forEach(n => {
        n.isRead = true;
        db.notifications.set(n.id, n);
      });

    res.json({ message: 'All notifications cleared.' });
  });

  // --- Admin/Owner Dashboard Reports & Analytics Metrics ---
  app.get('/api/analytics', (req, res) => {
    const user = getCurrentUser(req);
    if (!user || user.role === UserRole.CUSTOMER) {
      return res.status(403).json({ error: 'Restricted administrative report route.' });
    }

    // Extract target venues list
    const isOwner = user.role === UserRole.OWNER;
    const targets = Array.from(db.venues.values()).filter(v => !isOwner || v.ownerId === user.id);
    const targetIds = targets.map(v => v.id);

    // Sum matching bookings
    const bookingsList = Array.from(db.bookings.values()).filter(b => targetIds.includes(b.venueId));
    let totalRevenue = 0;
    let totalConfirmations = 0;
    const dailyPlot: { [date: string]: { revenue: number, bookings: number } } = {};

    // Build sports popularity map
    const sportPopularity: { [sport: string]: number } = {};

    bookingsList.forEach(b => {
      if (b.status === BookingStatus.CONFIRMED) {
        totalRevenue += b.totalAmount;
        totalConfirmations++;
        // track sport frequency
        sportPopularity[b.sportName || 'Other'] = (sportPopularity[b.sportName || 'Other'] || 0) + 1;
      }

      // Group date metrics
      const day = b.date;
      if (!dailyPlot[day]) {
         dailyPlot[day] = { revenue: 0, bookings: 0 };
      }
      dailyPlot[day].bookings++;
      if (b.status === BookingStatus.CONFIRMED) {
         dailyPlot[day].revenue += b.totalAmount;
      }
    });

    const activeCourtsCount = Array.from(db.courts.values()).filter(c => targetIds.includes(c.venueId)).length;
    const occupancyRate = activeCourtsCount > 0 ? Math.round((totalConfirmations / (activeCourtsCount * 7 * 6)) * 100) : 45; // dynamic relative estimate

    // Format calendar trend list
    const trendData = Object.keys(dailyPlot).map(day => ({
      date: day,
      revenue: dailyPlot[day].revenue,
      bookings: dailyPlot[day].bookings
    })).sort((a,b) => a.date.localeCompare(b.date));

    // Determine highest scoring sport
    let faveSport = 'None';
    let highCount = -1;
    Object.keys(sportPopularity).forEach(sport => {
      if (sportPopularity[sport] > highCount) {
        highCount = sportPopularity[sport];
        faveSport = sport;
      }
    });

    res.json({
      totalRevenue,
      bookingsCount: bookingsList.length,
      popularSport: faveSport === 'None' ? 'Badminton' : faveSport,
      occupancyRate: occupancyRate > 100 ? 92 : (occupancyRate || 68),
      history: trendData.length > 0 ? trendData : [
        { date: '2026-06-15', revenue: 1540, bookings: 3 },
        { date: '2026-06-16', revenue: 2100, bookings: 4 },
        { date: '2026-06-17', revenue: 3200, bookings: 6 },
        { date: '2026-06-18', revenue: 2800, bookings: 5 },
        { date: '2026-06-19', revenue: 3950, bookings: 7 },
        { date: '2026-06-20', revenue: 4500, bookings: 9 }
      ]
    });
  });

  // ----------------------------------------------------
  // GEMINI AI FEATURE ENDPOINTS
  // ----------------------------------------------------
  
  // Endpoint 1: Smart Venue Recommendations using Gemini 3.5 Flash
  app.post('/api/ai/recommendations', async (req, res) => {
    const user = getCurrentUser(req);
    const { preferredSport, maxBudget, city, priority } = req.body;

    const availableVenues = Array.from(db.venues.values())
      .filter(v => v.isApproved && v.city.toLowerCase() === (city || 'Bengaluru').toLowerCase())
      .map(v => ({
        id: v.id,
        name: v.name,
        address: v.address,
        priceMin: v.priceMin,
        facilities: v.facilities,
        rating: v.rating
      }));

    const promptContext = `
      You are the SportSphere AI Concierge.
      Give the user premium sports recommendations.
      User Preferences:
      - Preferred Sport: ${preferredSport || 'Any Sport / Multipurpose'}
      - Max Budget Per Hour: ₹${maxBudget || 'No Limit'}
      - Target City: ${city || 'Bengaluru'}
      - Booking Priority Rank: ${priority || 'Value for Money & High Ratings'}

      Our Available Live Arenas & Listings:
      ${JSON.stringify(availableVenues, null, 2)}

      Please return a neat JSON array matching the following schema EXACTLY. Stop writing markdown formatting tags, enclosing backticks, or 'json' prefixes. Just return raw parseable JSON:
      [
        {
          "venueId": "id of the selected venue",
          "venueName": "name of specified venue",
          "sportName": "${preferredSport || 'Football/Badminton'}",
          "matchScore": percentage number (e.g. 95),
          "reason": "witty, premium 1-2 sentence explanation recommending this turf based on their constraints",
          "availableSlotsToday": number of estimated slots
        }
      ]
    `;

    const ai = getAiHelper();
    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not defined or configured yet
      const fallbackList = Array.from(db.venues.values())
        .filter(v => v.isApproved)
        .slice(0, 2)
        .map(v => ({
          venueId: v.id,
          venueName: v.name,
          sportName: preferredSport || 'Badminton',
          matchScore: 92,
          reason: `SportSphere AI Fallback recommendation: "${v.name}" in ${v.city} provides exemplary synthetic surfaces and top facilities like ${v.facilities.slice(0, 3).join(', ')}. Connect your GEMINI_API_KEY for dynamic custom AI predictions.`,
          availableSlotsToday: 8
        }));
      return res.json(fallbackList);
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptContext,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '[]';
      const parsedRecommendations = JSON.parse(responseText.trim());
      res.json(parsedRecommendations);
    } catch (err: any) {
      console.error('Gemini Recommendation API error: ', err);
      // Fallback on parse failure or api rate limits
      res.json([
        {
          venueId: 'v_arena_prime',
          venueName: 'The Turf Arena Prime',
          sportName: preferredSport || 'Football',
          matchScore: 88,
          reason: 'Excellent value matching artificial turf parameters in Koramangala. Floodlight access offers peak evening play.',
          availableSlotsToday: 12
        }
      ]);
    }
  });

  // Endpoint 2: Popular Slot Occupancy and Dynamic Trend Predictions
  app.get('/api/ai/trends', async (req, res) => {
    const { venueId } = req.query;
    if (!venueId) {
      return res.status(400).json({ error: 'venueId query required for slot trends' });
    }

    const venueObj = db.venues.get(venueId as string);
    if (!venueObj) {
      return res.status(404).json({ error: 'Venue not found in registry Database' });
    }

    // Count historic booking distribution
    const venueBookings = Array.from(db.bookings.values()).filter(b => b.venueId === venueId);
    const hourlyCounts: { [hour: number]: number } = {};
    venueBookings.forEach(b => {
      const hh = parseInt(b.startTime.split(':')[0]);
      if (!isNaN(hh)) {
        hourlyCounts[hh] = (hourlyCounts[hh] || 0) + 1;
      }
    });

    const promptContext = `
      You are the SportSphere AI Forecaster.
      Analyze peak occupancy hour slots for "${venueObj.name}".
      We have historical hourly booking counts to guide you:
      ${JSON.stringify(hourlyCounts, null, 2)}

      Please forecast traffic patterns and demand level predictions for subsequent upcoming slots (Early morning 06:00, Mid-day 12:00, Prime evening 18:00, Late Night 21:00).
      Return details in raw, clean parseable JSON array of objects without any markdown backticks. Strictly use this structure:
      [
        {
          "hour": "HH:00 - HH:00",
          "demandLevel": "High" | "Medium" | "Low",
          "bookingProbability": number (percentage e.g. 85),
          "surgeMultiplier": number (e.g. 1.2 or 1.0),
          "reason": "1 sentence explaining why, such as post-work activity or premium cooling discount"
        }
      ]
    `;

    const ai = getAiHelper();
    if (!ai) {
      // Return solid structural fallback forecasts
      return res.json([
        {
          hour: "06:00 - 08:00",
          demandLevel: "Medium",
          bookingProbability: 55,
          surgeMultiplier: 1.0,
          reason: "Mild morning weather attracts fitness-oriented tennis and soccer groups looking for sunrise exercises."
        },
        {
          hour: "12:00 - 15:00",
          demandLevel: "Low",
          bookingProbability: 20,
          surgeMultiplier: 0.8, // dynamic discount alert
          reason: "Peak midday sun reduces outdoor turf traffic, ideal for smart savings seekers booking indoor slots."
        },
        {
          hour: "18:00 - 20:00",
          demandLevel: "High",
          bookingProbability: 95,
          surgeMultiplier: 1.25, // surge price
          reason: "High demand during after-work hours. Corporate groups rush badminton & futsal slots."
        },
        {
          hour: "20:00 - 22:00",
          demandLevel: "High",
          bookingProbability: 80,
          surgeMultiplier: 1.1,
          reason: "Cooler climate attracts box cricket and 5-a-side friendly matches."
        }
      ]);
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptContext,
        config: {
          responseMimeType: 'application/json'
        }
      });
      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } catch (err: any) {
      console.error('Gemini Trend API error: ', err);
      // Fallback
      res.json([
        {
          hour: "18:00 - 21:00",
          demandLevel: "High",
          bookingProbability: 90,
          surgeMultiplier: 1.2,
          reason: "Sunset floodlight games remain extremely popular for local office leagues."
        }
      ]);
    }
  });

  // ----------------------------------------------------
  // VITE & STATIC BUILD ROUTING MIDDLEWARES
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SportSphere Engine] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[SportSphere Fail] Out of bounds startup error:', error);
});
