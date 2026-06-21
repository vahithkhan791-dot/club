import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Sparkles, AlertCircle, CheckCircle, 
  Clock, ShieldAlert, Award, Send, Star, Zap, Info , ChevronDown 
} from 'lucide-react';
import { Venue, Court, Slot, Review, AISlotPrediction } from '../types';
import StarRating from '../components/StarRating';

interface VenueDetailProps {
  venueId: string;
  onPageChange: (page: string) => void;
  currentUser: { id: string } | null;
}

export default function VenueDetail({ venueId, onPageChange, currentUser }: VenueDetailProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedSportId, setSelectedSportId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [slotTrends, setSlotTrends] = useState<AISlotPrediction[]>([]);

  // User review states
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Checkout flow states
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorHeader, setErrorHeader] = useState('');

  // Generate date selectors (Next 7 days)
  const [datesArray, setDatesArray] = useState<{ label: string, ISO: string }[]>([]);

  useEffect(() => {
    // Generate dates
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
        ISO: d.toISOString().split('T')[0]
      });
    }
    setDatesArray(dates);
    setSelectedDate(dates[0].ISO);
  }, []);

  useEffect(() => {
    fetchVenueDetails();
    fetchAITrends();
  }, [venueId]);

  useEffect(() => {
    if (selectedCourtId && selectedDate) {
      fetchRealTimeSlots();
    }
  }, [selectedCourtId, selectedDate]);

  const fetchVenueDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/venues/${venueId}`);
      if (response.ok) {
        const data = await response.json();
        setVenue(data);
        setCourts(data.courts || []);
        setReviews(data.reviews || []);
        
        // Auto select first court if available
        if (data.courts && data.courts.length > 0) {
          setSelectedCourtId(data.courts[0].id);
          setSelectedSportId(data.courts[0].sportId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRealTimeSlots = async () => {
    setSlotsLoading(true);
    setErrorHeader('');
    try {
      const response = await fetch(`/api/slots?courtId=${selectedCourtId}&date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      }
    } catch (err) {
      setErrorHeader('Could not refresh time slots.');
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchAITrends = async () => {
    setTrendsLoading(true);
    try {
      const response = await fetch(`/api/ai/trends?venueId=${venueId}`);
      if (response.ok) {
        const data = await response.json();
        setSlotTrends(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTrendsLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      onPageChange('auth');
      return;
    }

    if (!selectedSlotId) return;

    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ slotId: selectedSlotId })
      });

      const data = await response.json();
      if (response.ok) {
        setBookingSuccess(data);
        setSelectedSlotId('');
        // Refresh local slots
        fetchRealTimeSlots();
      } else {
        setErrorHeader(data.error || 'Checkout process halted.');
      }
    } catch (err) {
      setErrorHeader('Connection block during payment gateway checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onPageChange('auth');
      return;
    }

    if (!userComment) return;

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          venueId,
          rating: userRating,
          comment: userComment
        })
      });

      if (response.ok) {
        setReviewSuccess('Review published successfully!');
        setUserComment('');
        fetchVenueDetails(); // Reload review listings and recalculated averages
        setTimeout(() => setReviewSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !venue) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Synchronizing arena schedules...</p>
      </div>
    );
  }

  const selectedCourt = courts.find(c => c.id === selectedCourtId);
  const selectedSlot = slots.find(s => s.id === selectedSlotId);

  return (
    <div className="space-y-8 select-none">
      
      {/* Back to Discovery Feed Button */}
      <button 
        onClick={() => onPageChange('explore')}
        className="inline-flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider text-blue-600 hover:text-blue-800 uppercase cursor-pointer"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        Back to Arenas List
      </button>

      {/* Booking confirmation success banner overlay */}
      {bookingSuccess && (
        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-700 animate-bounce">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-900 text-lg">Booking Confirmed! 🎯</h3>
              <p className="text-xs text-gray-600 mt-1">
                Your court slot reservation was captured. Instant payment processed successfully via Razorpay.
              </p>
              <div className="flex gap-4 mt-2 font-mono text-[10px] text-gray-500 font-bold uppercase">
                <span>ID: {bookingSuccess.booking.id}</span>
                <span>Slot: {bookingSuccess.booking.startTime} - {bookingSuccess.booking.endTime}</span>
                <span>Date: {bookingSuccess.booking.date}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setBookingSuccess(null);
              onPageChange('user-dashboard');
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wider uppercase shadow-md cursor-pointer"
          >
            My Ledger
          </button>
        </div>
      )}

      {/* Main Layout Row (Details + Interactive Selection Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Venue galleries, descriptions, map layout, ratings reviews */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Photos Carousel Mockup Container */}
          <div className="relative rounded-3xl overflow-hidden shadow-md">
            <img 
              src={venue.imageUrls[0]} 
              alt={venue.name} 
              className="w-full h-80 sm:h-96 object-cover pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex items-end p-6">
              <div className="text-white space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-[10px] font-mono tracking-wider uppercase">
                  ★ {venue.rating} ({venue.reviewCount} reviews)
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
                  {venue.name}
                </h2>
                <p className="text-gray-200 text-xs sm:text-sm font-mono tracking-wide">
                  {venue.address}, {venue.city}
                </p>
              </div>
            </div>
          </div>

          {/* Description & Facilities List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="font-sans font-extrabold text-slate-900 text-base tracking-tight">Arena Overview</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {venue.description}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h3 className="font-sans font-extrabold text-slate-900 text-base tracking-tight">Included Club Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {venue.facilities.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic AI Slot Occupancy Trends - Powered by Gemini API */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                Gemini Slot Occupancy Forecast
              </h3>
              <span className="text-[10px] uppercase font-bold text-blue-300 font-mono">Real-Time Forecasts</span>
            </div>

            {trendsLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
                <p className="text-[10px] text-slate-400 font-mono">Gemini analyzing past bookings...</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  💡 Dynamic insights derived by SportSphere AI detailing hourly trends for <b>{venue.name}</b>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {slotTrends.map((trend, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-200">{trend.hour}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono tracking-wider ${
                          trend.demandLevel === 'High' ? 'bg-rose-500/20 text-rose-300' :
                          trend.demandLevel === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {trend.demandLevel} Demand
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic mt-2.5">
                        "{trend.reason}"
                      </p>
                      <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-2 text-[10px] font-mono text-slate-500 uppercase font-bold">
                        <span>Prob: {trend.bookingProbability}%</span>
                        {trend.surgeMultiplier > 1.0 && (
                          <span className="text-rose-300 font-semibold flex items-center gap-0.5">
                            ⚡ Price x{trend.surgeMultiplier}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Google Maps Mock Container */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-sans font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
              <MapPin className="w-5 h-5 text-blue-600" />
              Venue Coordinates on Google Maps
            </h3>
            
            <div className="bg-slate-100 h-64 rounded-2xl relative overflow-hidden select-none border border-slate-200 shadow-inner group">
              <div className="absolute inset-0 bg-cover bg-center pointer-events-none filter saturate-140 brightness-95 opacity-80" 
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')` }} 
              />
              {/* Target Location Card Overlay */}
              <div className="absolute top-1/2 left-1/2 -ml-28 -mt-16 w-56 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 text-center shadow-lg transition-transform group-hover:scale-105 duration-300">
                <span className="text-[9px] leading-none uppercase tracking-widest font-extrabold text-blue-600 font-mono block mb-1">SportSphere Map Location Pin</span>
                <span className="text-xs font-bold text-slate-900 block leading-tight truncate">{venue.name}</span>
                <span className="text-[9px] text-slate-400 font-mono block mt-1">lat: {venue.latitude} | lng: {venue.longitude}</span>
              </div>
            </div>
          </div>

          {/* Reviews & Average ratings module */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-sans font-extrabold text-slate-900 text-base tracking-tight">
              Customer Feedbacks & Ratings
            </h3>

            {/* Submit Star Reviews Form */}
            <form onSubmit={submitReview} className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl space-y-3.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono block">Review our Turfs</span>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Star Rating:</span>
                <StarRating 
                  rating={userRating} 
                  interactive={true} 
                  onRatingChange={(num) => setUserRating(num)} 
                  size={22}
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder={`Write your genuine experience about Court condition, lights, lockerooms...`}
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 resize-none text-slate-800"
                />
              </div>

              <div className="flex justify-between items-center">
                {reviewSuccess ? (
                  <span className="text-[11px] font-bold text-emerald-600">{reviewSuccess}</span>
                ) : <span />}
                
                <button
                  type="submit"
                  disabled={!userComment}
                  className="px-4.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  Publish Review
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 font-mono text-center py-4 animate-pulse">Be the first to leave a verified review!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 leading-none">{r.userName}</p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          {new Date(r.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <StarRating rating={r.rating} size={14} />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed italic mt-3 pl-2 border-l-2 border-blue-500">
                      "{r.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right column: Interactive court selections, dates arrays, hours grids, and side checkouts */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Reservation Panel</span>

            {/* Select Courts Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase font-mono text-slate-500">1. Sport Court Arena</label>
              <select
                value={selectedCourtId}
                onChange={(e) => setSelectedCourtId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-semibold"
              >
                {courts.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (₹{c.pricePerHour}/Hr)</option>
                ))}
              </select>
            </div>

            {/* Select Date Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase font-mono text-slate-500 block">2. Select Play Date</label>
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {datesArray.map((date) => (
                  <button
                    key={date.ISO}
                    onClick={() => {
                      setSelectedDate(date.ISO);
                      setSelectedSlotId('');
                    }}
                    className={`p-2 rounded-xl text-[10px] font-bold text-center border cursor-pointer flex flex-col items-center justify-center gap-0.5 select-none transition-all ${
                      selectedDate === date.ISO 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="leading-none">{date.label.split(',')[0]}</span>
                    <span className="text-xs leading-none">{date.label.split(',')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Slot Time Section */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-extrabold uppercase font-mono text-slate-500 block">3. Select Slot Hour</label>
              
              {errorHeader && (
                <div className="p-2 border border-red-200 bg-red-50 text-red-600 font-semibold text-[10px] rounded-lg">
                  {errorHeader}
                </div>
              )}

              {slotsLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-[10px] text-slate-400 font-mono">Syncing slots availability...</p>
                </div>
              ) : selectedCourtId === '' ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 text-center font-mono">
                  Select a court to see available hours
                </div>
              ) : slots.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 text-center font-mono">
                  No slots loaded for this schedule
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const availabilityText = slot.isBooked ? 'Booked' : isSelected ? 'Selected' : 'Open';
                    return (
                      <button
                        key={slot.id}
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition-colors cursor-pointer select-none font-semibold ${
                          slot.isBooked ? 'bg-rose-50 text-rose-300 border-rose-150 cursor-not-allowed text-center' :
                          isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' :
                          'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-xs'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 mb-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`} />
                        <span className="leading-none">{slot.startTime}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono mt-0.5">
                          {availabilityText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Instant checkout card summary side layout */}
            {selectedSlot && (
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-150 space-y-3 pt-4 border-t-2 border-t-blue-600 select-none animate-fade-in">
                <span className="text-[10px] uppercase font-extrabold text-blue-700 font-mono">Slot Summary Ledger</span>
                
                <div className="text-xs text-slate-700 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>Court Arena Charge:</span>
                    <span className="font-bold text-slate-900 font-mono">₹{selectedSlot.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>GST (CGST+SGST 18%):</span>
                    <span className="font-bold text-slate-900 font-mono">₹{Math.round(selectedSlot.price * 0.18)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-150/30 pt-2 text-sm font-extrabold">
                    <span className="text-blue-800">Total Book Value:</span>
                    <span className="text-blue-950 font-mono">₹{Math.round(selectedSlot.price * 1.18)}</span>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl border border-blue-100 flex gap-1.5 items-start text-[10px] text-slate-400 tracking-wider">
                  <Zap className="w-4 h-4 text-emerald-500 mt-0.5 animate-pulse flex-shrink-0" />
                  <p>Razorpay Payment verification and live tickets logging integrated dynamically.</p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  {checkoutLoading ? 'Processing on Gateway...' : 'Pay with Razorpay'}
                  <Zap className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
