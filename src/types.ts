/**
 * Shared Type Definitions for SportSphere Sports Booking Platform
 */

export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  CUSTOMER = 'customer'
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  isApproved: boolean; // Owner accounts require admin approval
  createdAt: string;
}

export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  facilities: string[];
  rating: number;
  reviewCount: number;
  priceMin: number;
  imageUrls: string[];
  isApproved: boolean;
  createdAt: string;
}

export interface Sport {
  id: string;
  name: string; // Cricket, Football, Badminton, Tennis, Basketball, Volleyball
  icon: string;  // lucide-react icon identifier
}

export interface Court {
  id: string;
  venueId: string;
  sportId: string;
  name: string; // e.g. "Court A", "Pitch 1", "Turf 2"
  pricePerHour: number;
}

export interface Slot {
  id: string;
  courtId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24-hour style e.g. "09:00")
  endTime: string; // HH:MM (e.g. "10:00")
  isBooked: boolean;
  price: number;
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

export interface Booking {
  id: string;
  userId: string;
  venueId: string;
  courtId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  // Included populated metadata for frontend UX
  venueName?: string;
  courtName?: string;
  sportName?: string;
  userName?: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  CAPTURED = 'captured',
  REFUNDED = 'refunded'
}

export interface Payment {
  id: string;
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  venueId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export enum NotificationType {
  BOOKING = 'booking',
  CANCELLATION = 'cancellation',
  REMINDER = 'reminder',
  SYSTEM = 'system'
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  createdAt: string;
}

export interface AIRecommendation {
  venueId: string;
  venueName: string;
  sportName: string;
  matchScore: number; // Percentage
  reason: string;
  availableSlotsToday: number;
}

export interface AISlotPrediction {
  hour: string; // e.g. "18:00 - 19:00"
  demandLevel: 'High' | 'Medium' | 'Low';
  bookingProbability: number; // 0-100
  surgeMultiplier: number;
  reason: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  bookingsCount: number;
  popularSport: string;
  occupancyRate: number; // 0-100
  history: {
    date: string;
    revenue: number;
    bookings: number;
  }[];
}
