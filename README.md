# SportSphere 🏟️ - Sports Booking Platform

SportSphere is a premium, high-performance, full-stack Sports Booking Platform designed to connect athletes, corporate groups, and sportspersons with available play venues (Cricket, Football, Badminton, Tennis, Basketball, and Volleyball) in real-time. Similar to industry pioneers like **Playo** and **Hudle**, SportSphere provides premium calendar slot grids, instant booking checkouts through Razorpay, robust role-based visual dashboards (User, Venue Partner, Super Admin), and integrated Gemini AI features.

---

## 🚀 Key Architectural Highlights

*   **Real-time Slot Engine:** Dynamic generation of available hourly slot ledgers for consecutive days, updating automatically on checkout completion or cancellation refunds.
*   **Gemini AI Concierge:** Integrated model recommendation queries (`gemini-3.5-flash`) that match user sports, city, and price constraints.
*   **Gemini Occupancy Forecasts:** Analysis of historic times to forecast future traffic and surge prices.
*   **Razorpay Simulative Payments:** Instant checkout simulation coupled with a rollback refund trigger on cancelled sessions.

---

## 🗄️ Database Relational Design (ER Diagram)

SportSphere implements a strict relational database architecture mapped cleanly across the following relationship trees:

### Relationship Mapping / Cardinality
1.  **Users & Roles (1:1):** A user belongs to exactly one role (`admin`, `owner`, `customer`).
2.  **Venues & Users (Many:1):** A Partner User (`owner`) can register multiple venues/stadiums. Common customers book across them.
3.  **Courts & Venues (Many:1):** A single Sports Venue owns multiple distinct courts, pitches, or playing turfs.
4.  **Courts & Sports (Many:1):** Each court is calibrated for a specific sports category (e.g. Badminton, Football).
5.  **Slots & Courts (Many:1):** A Court possesses multiple dynamic hourly slot templates across sequential days.
6.  **Bookings & Slots/Users/Courts (Many:1):** A booking ties a User, Venue, Court, and single target Slot together.
7.  **Payments & Bookings (1:1):** Each booking has exactly one payment ledger verifying Razorpay order states.
8.  **Reviews & Venues/Users (Many:1):** Many users can rate a target sports arena.
9.  **Notifications & Users (Many:1):** A user receives private system notifications for transaction triggers.

---

## 📝 MySQL Create Schema SQL Scripts

Below are the production-ready DDL scripts to set up the relational schema in your target MySQL instance (Vercel/Railway DBs, Amazon RDS, or Google Cloud SQL):

```sql
-- Create Database
CREATE DATABASE IF NOT EXISTS sportsphere_db;
USE sportsphere_db;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'owner', 'customer') DEFAULT 'customer',
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_email (email)
);

-- 2. Table: venues
CREATE TABLE IF NOT EXISTS venues (
  id VARCHAR(255) PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  facilities TEXT NOT NULL, -- Stored as compiled serialized JSON or string list
  rating DECIMAL(3, 2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  price_min DECIMAL(10, 2) NOT NULL,
  image_urls TEXT NOT NULL,  -- Stored as compiled serialized JSON array
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_venue_city (city)
);

-- 3. Table: sports
CREATE TABLE IF NOT EXISTS sports (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(100) NOT NULL
);

-- 4. Table: courts
CREATE TABLE IF NOT EXISTS courts (
  id VARCHAR(255) PRIMARY KEY,
  venue_id VARCHAR(255) NOT NULL,
  sport_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE
);

-- 5. Table: slots
CREATE TABLE IF NOT EXISTS slots (
  id VARCHAR(255) PRIMARY KEY,
  court_id VARCHAR(255) NOT NULL,
  date_string DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
  INDEX idx_slot_search (court_id, date_string)
);

-- 6. Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  venue_id VARCHAR(255) NOT NULL,
  court_id VARCHAR(255) NOT NULL,
  slot_id VARCHAR(255) NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE
);

-- 7. Table: payments
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY,
  booking_id VARCHAR(255) NOT NULL,
  razorpay_order_id VARCHAR(255) NOT NULL,
  razorpay_payment_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'captured', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 8. Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  venue_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);

-- 9. Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  type ENUM('booking', 'cancellation', 'reminder', 'system') DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 📌 API Interface Documentation

Your SportSphere server exposes robust REST endpoints under `/api/*`:

### 🔐 Authentication System Router
*   **`POST /api/auth/register`**
    *   Creates customer or partner account profile.
    *   *Body:* `{ email, name, role }`
*   **`POST /api/auth/login`**
    *   Logs in and launches playground credentials.
    *   *Body:* `{ email }`
*   **`GET /api/auth/me`**
    *   Authenticates session and validates current profile.

### 🏟️ Venues & Field Management
*   **`GET /api/venues`**
    *   Queries active approved sports arenas. Supports pagination and search filters like `city`, `sportId`, `query`, `maxPrice`.
*   **`GET /api/venues/:id`**
    *   Returns complete venue metadata equipped with children courts and verified reviews.
*   **`POST /api/venues`**
    *   Lets partners register brand new locations.
*   **`POST /api/courts`**
    *   Appends courts/futsal grounds to arenas, automatically initializing consecutive booking slot calendars.

### 🎯 Bookings & Financial Gateways
*   **`GET /api/slots`**
    *   Returns real-time slot availability for selected courts on target schedule dates.
*   **`POST /api/bookings`**
    *   Locks slots, saves bookings logs, and captures simulative Razorpay invoice states.
*   **`POST /api/bookings/:id/cancel`**
    *   Cancels slot bookings, issues rollback refunds, and returns courts back to "Open" booking states.

### 🧠 Gemini AI Engine Services
*   **`POST /api/ai/recommendations`**
    *   Asks Gemini 3.5 Flash to recommend optimal venues based on sport type, maximum budget, and preferred city.
*   **`GET /api/ai/trends?venueId=ID`**
    *   Analyzes historical occupancies to return beautiful, witty hourly predictions, demand levels, and surge ratios.

---

## 🛠️ Folder Structure Specifications

The SportSphere codebase is divided into clear modular layers separating data modeling, REST routing, and components rendering:

```
├── .env.example                # Required variables declaration template
├── package.json                # Project script execution nodes and dependencies
├── server.ts                   # Unified Express core controller & Vite compiler middleware
├── server                      # Database & data structure workspace
│   └── db.ts                   # In-Memory Relational Maps seeded with premium turfs
├── src                         # Frontend client workspace
│   ├── main.tsx                # Client entry point
│   ├── index.css               # Inter & Space Grotesk font imports + Tailwind CSS
│   ├── types.ts                # App TypeScript interface declarations
│   ├── App.tsx                 # Master state-machine, router and layout orchestration
│   ├── components              # Shared component blocks
│   │   ├── Layout.tsx          # General page framing, notification trays & headers
│   │   ├── StarRating.tsx      # custom star reviews widget
│   │   └── AIConcierge.tsx     # Gemini recommendations modal
│   └── pages                   # Action Pages
│       ├── Auth.tsx            # Login/Register toggles and quick access
│       ├── Explore.tsx         # Discovery search panels and categories filters
│       ├── VenueDetail.tsx     # Calendar grids, slot managers & Razorpay checkouts
│       ├── UserDashboard.tsx   # Reservation logs & cancellations ledgers
│       ├── OwnerDashboard.tsx  # Partner cockpit with add forms & revenue graphs
│       └── AdminDashboard.tsx  # Admin decks, pending approvals, global stats
└── tsconfig.json               # TypeScript path alias rules
```

---

## 📦 Deployment & DevOps Guide

### 1. Dev / local Environment Setup
```bash
# Install package dependencies
npm install

# Build / Run Dev server synchronously on Port 3000
npm run dev
```

### 2. Vercel deployment (Frontend SPA)
1.  Connect your GitHub repository to Vercel.
2.  Set the Framework Preset to **Vite** or **Create React App**.
3.  Set the Build Command to `npm run build` and output directory as `dist`.
4.  Insert environment parameters in Vercel Settings (including custom `GEMINI_API_KEY`).

### 3. Railway / Cloud Run deployment (Full Stack Node Container)
1.  Verify Port binding is mapping to standard container ingress variables (SportSphere binds explicitly to `0.0.0.0` and port `3000`).
2.  Integrate Cloud SQL databases (PostgreSQL or MySQL) using the schema scripts compiled above.
3.  Execute the build command:
    ```bash
    npm run build
    npm run start
    ```
