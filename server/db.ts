import { 
  User, UserRole, Venue, Sport, Court, Slot, Booking, BookingStatus, 
  Payment, PaymentStatus, Review, Notification, NotificationType 
} from '../src/types';

// In-Memory Relational Database implementing real relations, primary keys, and foreign keys.
// This database serves SportSphere seamlessly on port 3000.
class MockRelationalDb {
  public users: Map<string, User> = new Map();
  public venues: Map<string, Venue> = new Map();
  public sports: Map<string, Sport> = new Map();
  public courts: Map<string, Court> = new Map();
  public slots: Map<string, Slot> = new Map();
  public bookings: Map<string, Booking> = new Map();
  public payments: Map<string, Payment> = new Map();
  public reviews: Map<string, Review> = new Map();
  public notifications: Map<string, Notification> = new Map();

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    // 1. Seed Roles and Users
    const adminUser: User = {
      id: 'usr_admin',
      email: 'vahithkhan791@gmail.com', // Admin user
      name: 'Vahith Admin',
      role: UserRole.ADMIN,
      isApproved: true,
      createdAt: new Date().toISOString()
    };

    const ownerUser1: User = {
      id: 'usr_owner1',
      email: 'owner1@sportsphere.com',
      name: 'Rajesh Kumar (Owner)',
      role: UserRole.OWNER,
      isApproved: true,
      createdAt: new Date().toISOString()
    };

    const ownerUser2: User = {
      id: 'usr_owner2',
      email: 'owner2@sportsphere.com',
      name: 'Sarah Dsouza (Owner)',
      role: UserRole.OWNER,
      isApproved: false, // Requires Admin approval
      createdAt: new Date().toISOString()
    };

    const customerUser: User = {
      id: 'usr_customer',
      email: 'customer@test.com',
      name: 'Aditya Sen',
      role: UserRole.CUSTOMER,
      isApproved: true,
      createdAt: new Date().toISOString()
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(ownerUser1.id, ownerUser1);
    this.users.set(ownerUser2.id, ownerUser2);
    this.users.set(customerUser.id, customerUser);

    // 2. Seed Sports
    const sportsData: Sport[] = [
      { id: 's_cricket', name: 'Cricket', icon: 'Cricket' },
      { id: 's_football', name: 'Football', icon: 'Tv' }, // using accessible lucide icons
      { id: 's_badminton', name: 'Badminton', icon: 'GitCommit' },
      { id: 's_tennis', name: 'Tennis', icon: 'CircleDot' },
      { id: 's_basketball', name: 'Basketball', icon: 'Dribbble' },
      { id: 's_volleyball', name: 'Volleyball', icon: 'Flame' }
    ];
    sportsData.forEach(s => this.sports.set(s.id, s));

    // 3. Seed Venues
    const venuesData: Venue[] = [
      {
        id: 'v_arena_prime',
        ownerId: 'usr_owner1',
        name: 'The Turf Arena Prime',
        description: 'Elite sports complex offering international standard synthetic turf pitches, premium lighting, and air-conditioned changing lounges.',
        address: '80 Feet Rd, Koramangala 4th Block',
        city: 'Bengaluru',
        latitude: 12.9345,
        longitude: 77.6256,
        facilities: ['Locker Rooms', 'Showers', 'Night Floodlights', 'Water Dispensers', 'Cafeteria', 'Parking'],
        rating: 4.8,
        reviewCount: 3,
        priceMin: 600,
        imageUrls: [
          'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600',
          'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=600'
        ],
        isApproved: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'v_smash_shuttle',
        ownerId: 'usr_owner1',
        name: 'Smash & Spin Arena',
        description: 'Premium indoor sports center specializing in professional badminton courts with anti-slip mats and tennis synthetic turf arrays.',
        address: 'HSR Layout Sector 2, Lane 4',
        city: 'Bengaluru',
        latitude: 12.9103,
        longitude: 77.6450,
        facilities: ['Water Dispensers', 'Power Backup', 'Racket Rentals', 'Showers', 'Coaching Zone'],
        rating: 4.6,
        reviewCount: 2,
        priceMin: 350,
        imageUrls: [
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
          'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600'
        ],
        isApproved: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'v_gachibowli_turfs',
        ownerId: 'usr_owner2', // Owned by non-approved user Sarah
        name: 'Gachibowli Pro Arena',
        description: 'Your premium sports sanctuary in Hyderabad with multiple box-cricket spaces and a state-of-the-art futsal zone.',
        address: 'Near DLF Cybercity, Gachibowli',
        city: 'Hyderabad',
        latitude: 17.4483,
        longitude: 78.3488,
        facilities: ['Showers', 'Floodlights', 'Drinks Station', 'Referee Service'],
        rating: 4.2,
        reviewCount: 0,
        priceMin: 700,
        imageUrls: [
          'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=600'
        ],
        isApproved: false, // Starts as not approved for owner confirmation demo
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    venuesData.forEach(v => this.venues.set(v.id, v));

    // 4. Seed Courts (Linked to Venues and Sports)
    const courtsData: Court[] = [
      // Turf Arena Prime (Football & Cricket)
      { id: 'c_prime_f_1', venueId: 'v_arena_prime', sportId: 's_football', name: '7-A-Side Futsal Pitch 1', pricePerHour: 800 },
      { id: 'c_prime_f_2', venueId: 'v_arena_prime', sportId: 's_football', name: '5-A-Side Futsal Pitch 2', pricePerHour: 600 },
      { id: 'c_prime_c_3', venueId: 'v_arena_prime', sportId: 's_cricket', name: 'Box Cricket Arena A', pricePerHour: 1000 },
      // Smash & Spin Arena (Badminton & Tennis)
      { id: 'c_smash_b_1', venueId: 'v_smash_shuttle', sportId: 's_badminton', name: 'Shuttle Court 1 (Yonin)', pricePerHour: 350 },
      { id: 'c_smash_b_2', venueId: 'v_smash_shuttle', sportId: 's_badminton', name: 'Shuttle Court 2 (Yonin)', pricePerHour: 350 },
      { id: 'c_smash_t_3', venueId: 'v_smash_shuttle', sportId: 's_tennis', name: 'Clay Court Center', pricePerHour: 500 },
      // Gachibowli Pro
      { id: 'c_gach_c_1', venueId: 'v_gachibowli_turfs', sportId: 's_cricket', name: 'IPL Box Turf', pricePerHour: 900 },
      { id: 'c_gach_v_2', venueId: 'v_gachibowli_turfs', sportId: 's_volleyball', name: 'Sand Volley Court', pricePerHour: 700 },
    ];
    courtsData.forEach(c => this.courts.set(c.id, c));

    // 5. Seed Slots for the next 7 days, for all Courts
    // We will dynamically spawn slots starting today so user can book real slots
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dateStr = targetDate.toISOString().split('T')[0];

      courtsData.forEach(court => {
        // Generate hourly slots from 06:00 to 22:00
        for (let hour = 6; hour < 22; hour++) {
          const startStr = `${hour.toString().padStart(2, '0')}:00`;
          const endStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
          const slotId = `slot_${court.id}_${dateStr}_${hour}`;
          
          // Let's pre-book some random historic slots for analytics data
          const isBeforeNow = dayOffset === 0 && hour < today.getHours();
          const shouldRandomlyBook = isBeforeNow || (dayOffset > 0 && Math.random() < 0.25);

          this.slots.set(slotId, {
            id: slotId,
            courtId: court.id,
            date: dateStr,
            startTime: startStr,
            endTime: endStr,
            isBooked: shouldRandomlyBook,
            price: court.pricePerHour
          });

          // If pre-booked and in the past/present, let's create actual Bookings for analytics.
          if (shouldRandomlyBook) {
            const bookingId = `b_seed_${court.id}_${dateStr}_${hour}`;
            this.bookings.set(bookingId, {
              id: bookingId,
              userId: 'usr_customer',
              venueId: court.venueId,
              courtId: court.id,
              slotId: slotId,
              date: dateStr,
              startTime: startStr,
              endTime: endStr,
              totalAmount: court.pricePerHour,
              status: BookingStatus.CONFIRMED,
              createdAt: new Date(targetDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              venueName: this.venues.get(court.venueId)?.name,
              courtName: court.name,
              sportName: this.sports.get(court.sportId)?.name,
              userName: 'Aditya Sen'
            });

            // Also seed a successful Payment
            const paymentId = `p_seed_${bookingId}`;
            this.payments.set(paymentId, {
              id: paymentId,
              bookingId: bookingId,
              razorpayOrderId: `rpay_order_${bookingId}`,
              razorpayPaymentId: `rpay_pay_${bookingId}`,
              amount: court.pricePerHour,
              status: PaymentStatus.CAPTURED,
              createdAt: new Date(targetDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }
      });
    }

    // 6. Seed Reviews (Targeting Turf Arena Prime and Smash Shuttle)
    const reviewsData: Review[] = [
      {
        id: 'rev_1',
        userId: 'usr_customer',
        venueId: 'v_arena_prime',
        userName: 'Aditya Sen',
        rating: 5,
        comment: 'Absolutely spectacular grass feel! The floodlights are bright, and changing rooms are cleaner than most sports clubs. Definitely booking again.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'rev_2',
        userId: 'usr_customer',
        venueId: 'v_arena_prime',
        userName: 'Siddharth M.',
        rating: 4.5,
        comment: 'A bit expensive but the 7-A-Side turf pitch is gorgeous. The canteen offers brilliant fresh juices.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'rev_3',
        userId: 'usr_customer',
        venueId: 'v_smash_shuttle',
        userName: 'Megha Rao',
        rating: 4.8,
        comment: 'Perfect shock absorption on Court 1! Best place for Badminton practice in Bangalore.',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    reviewsData.forEach(r => this.reviews.set(r.id, r));

    // 7. Seed Notifications
    const notificationsData: Notification[] = [
      {
        id: 'not_1',
        userId: 'usr_customer',
        title: 'Booking Confirmed!',
        message: 'Your slot at Turf Arena Prime for Pitch 1 is successfully scheduled.',
        isRead: false,
        type: NotificationType.BOOKING,
        createdAt: new Date().toISOString()
      },
      {
        id: 'not_2',
        userId: 'usr_owner1',
        title: 'New Venue Registered',
        message: 'Your venue Smash & Spin Arena has been approved and listing is live.',
        isRead: false,
        type: NotificationType.SYSTEM,
        createdAt: new Date().toISOString()
      }
    ];
    notificationsData.forEach(n => this.notifications.set(n.id, n));
  }
}

export const db = new MockRelationalDb();
