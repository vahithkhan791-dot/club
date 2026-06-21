import { useState, useEffect } from 'react';
import { 
  User, Calendar, Clock, RotateCcw, AlertTriangle, CheckCircle, 
  Trash, Sparkles, MapPin, Activity, BellRing, Mail, ChevronRight 
} from 'lucide-react';
import { Booking, BookingStatus } from '../types';

interface UserDashboardProps {
  currentUser: { id: string, name: string, email: string, role: string } | null;
  onPageChange: (page: string) => void;
  onSelectVenueId: (id: string) => void;
}

export default function UserDashboard({ currentUser, onPageChange, onSelectVenueId }: UserDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchUserBookings();
    }
  }, [currentUser]);

  const fetchUserBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${currentUser?.id}`
        }
      });
      if (response.ok) {
        setBookings(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking and request a processed automatic Razorpay refund?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser?.id}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Booking cancelled successfully and instant refund dispatched!');
        setErrorMsg('');
        fetchUserBookings(); // Refresh bookings state
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Cancellation declined.');
      }
    } catch (err) {
      setErrorMsg('Connection error during refund pipeline.');
    }
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* 1. Profile header visual frame */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4.5 text-center md:text-left flex-col md:flex-row">
          <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 text-2xl font-extrabold font-sans shadow-inner">
            {currentUser?.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-sans font-extrabold text-slate-900 text-xl tracking-tight leading-tight">
              {currentUser?.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 justify-center md:justify-start text-xs text-slate-400 font-bold">
              <span className="font-mono text-slate-500">{currentUser?.email}</span>
              <span className="text-slate-300">•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-extrabold tracking-wider uppercase text-[9px]">
                {currentUser?.role} Member
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onPageChange('explore')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-slate-950 text-white font-bold text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"
        >
          Explore Court Slots
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 font-bold text-center select-none animate-bounce">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-100 font-bold text-center select-none">
          {errorMsg}
        </div>
      )}

      {/* 2. Bookings Ledger list */}
      <div className="space-y-4">
        <h3 className="font-sans font-extrabold text-slate-900 text-lg tracking-tight">
          Your reservation history and tickets
        </h3>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Loading matches histories...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl py-12 text-center text-slate-400">
            <p className="font-bold text-slate-800 text-sm mb-1">No Booked Sports Slots Found</p>
            <p className="text-xs font-mono">You have not scheduled any sport court activities yet.</p>
            <button 
              onClick={() => onPageChange('explore')}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs cursor-pointer hover:bg-blue-100 transition-colors"
            >
              Book Your First Turf Slot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => {
              const isCancelled = booking.status === BookingStatus.CANCELLED;
              return (
                <div 
                  key={booking.id} 
                  className={`bg-white border rounded-3xl overflow-hidden p-5 flex flex-col justify-between transition-all ${
                    isCancelled ? 'border-dashed border-slate-200 opacity-60 bg-slate-50/40' : 'border-slate-200 hover:shadow-md hover:border-blue-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest">{booking.sportName} Slot</span>
                        <h4 className="font-sans font-extrabold text-slate-900 text-base leading-snug mt-0.5">
                          {booking.venueName}
                        </h4>
                        <p className="text-xs text-slate-500 font-bold truncate leading-none mt-1">
                          ↳ {booking.courtName}
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-[9px] uppercase tracking-wider ${
                        isCancelled ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 select-none">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-bold bg-slate-50 p-2 rounded-xl">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>{booking.date}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 font-bold bg-slate-50 p-2 rounded-xl">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Invoice captured</span>
                      <p className="font-mono font-extrabold text-sm text-slate-900 mt-0.5">₹{booking.totalAmount}</p>
                    </div>

                    {!isCancelled ? (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="p-2.5 rounded-xl border border-rose-100 hover:bg-rose-600 text-rose-500 hover:text-white transition-all hover:scale-[1.01] flex items-center gap-1 cursor-pointer text-xs font-bold uppercase tracking-wider"
                        title="Cancel reservation and process instant automatic Razorpay Refund"
                      >
                        <Trash className="w-4 h-4" />
                        Cancel Slot
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono font-semibold flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                        <RotateCcw className="w-3.5 h-3.5" /> Refund captured
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
