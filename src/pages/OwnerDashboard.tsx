import React, { useState, useEffect } from 'react';
import { 
  Building, Plus, DollarSign, Activity, Users, Settings, 
  MapPin, CheckCircle, AlertTriangle, PlusCircle, Sparkles, TrendingUp, BarChart3 
} from 'lucide-react';
import { Venue, Sport, RevenueAnalytics } from '../types';

interface OwnerDashboardProps {
  currentUser: { id: string } | null;
}

export default function OwnerDashboard({ currentUser }: OwnerDashboardProps) {
  // Analytical Reports States
  const [stats, setStats] = useState<RevenueAnalytics | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Venue Form Input States
  const [venueName, setVenueName] = useState('');
  const [venueDesc, setVenueDesc] = useState('');
  const [venueAddr, setVenueAddr] = useState('');
  const [venueCity, setVenueCity] = useState('Bengaluru');
  const [venuePrice, setVenuePrice] = useState('500');
  const [venueImg, setVenueImg] = useState('');
  const [facilities, setFacilities] = useState<string[]>(['Night Floodlights', 'Water Dispensers']);
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [venueSuccess, setVenueSuccess] = useState('');

  // Add Court Form Input States
  const [courtVenueId, setCourtVenueId] = useState('');
  const [courtSportId, setCourtSportId] = useState('');
  const [courtName, setCourtName] = useState('');
  const [courtPrice, setCourtPrice] = useState('500');
  const [courtSuccess, setCourtSuccess] = useState('');
  const [showAddCourt, setShowAddCourt] = useState(false);

  useEffect(() => {
    fetchOwnerData();
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const res = await fetch('/api/sports');
      if (res.ok) {
        setSports(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOwnerData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Owner Venues
      const venuesRes = await fetch('/api/owner/venues', {
        headers: {
          'Authorization': `Bearer ${currentUser?.id}`
        }
      });
      if (venuesRes.ok) {
        const list = await venuesRes.json();
        setVenues(list);
        if (list.length > 0) {
          setCourtVenueId(list[0].id);
        }
      }

      // 2. Fetch Owner Analytics
      const statsRes = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${currentUser?.id}`
        }
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName || !venueDesc || !venueAddr) return;

    try {
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.id}`
        },
        body: JSON.stringify({
          name: venueName,
          description: venueDesc,
          address: venueAddr,
          city: venueCity,
          priceMin: Number(venuePrice),
          facilities: facilities,
          imageUrls: venueImg ? [venueImg] : []
        })
      });

      if (res.ok) {
        setVenueSuccess('Court arena registered successfully! Submitted for Admin Approval.');
        // Clear Form inputs
        setVenueName('');
        setVenueDesc('');
        setVenueAddr('');
        setVenueImg('');
        
        // Refresh local owner dashboard data
        fetchOwnerData();
        setTimeout(() => {
          setVenueSuccess('');
          setShowAddVenue(false);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSport = courtSportId || (sports.length > 0 ? sports[0].id : '');
    const targetVenue = courtVenueId || (venues.length > 0 ? venues[0].id : '');

    if (!courtName || !courtPrice || !targetSport || !targetVenue) return;

    try {
      const res = await fetch('/api/courts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.id}`
        },
        body: JSON.stringify({
          venueId: targetVenue,
          sportId: targetSport,
          name: courtName,
          pricePerHour: Number(courtPrice)
        })
      });

      if (res.ok) {
        setCourtSuccess('Court created and slots generated dynamically for consecutive days!');
        setCourtName('');
        fetchOwnerData();
        setTimeout(() => {
          setCourtSuccess('');
          setShowAddCourt(false);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFacility = (facility: string) => {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter(f => f !== facility));
    } else {
      setFacilities([...facilities, facility]);
    }
  };

  const facilityOptions = ['Night Floodlights', 'Water Dispensers', 'Locker Rooms', 'Showers', 'Cafeteria', 'Parking'];

  return (
    <div className="space-y-8 select-none animate-fade-in">
      
      {/* 1. Analytics Reports Widgets */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Gross Earnings</span>
              <p className="text-2xl font-bold font-mono text-blue-600 mt-1">₹{stats.totalRevenue}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Confirmations</span>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{stats.bookingsCount}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Occupancy Rate</span>
              <p className="text-2xl font-bold font-mono text-blue-600 mt-1">{stats.occupancyRate}%</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Top Category</span>
              <p className="text-base font-bold text-slate-950 mt-1 truncate">{stats.popularSport}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Custom CSS Bar Chart Graph of Daily Revenue Trend */}
      {stats && stats.history && stats.history.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Revenue Match Calendar History
          </h3>
          
          <div className="h-64 flex items-end gap-3 sm:gap-6 border-b border-slate-100 pb-4 pt-8 shrink-0">
            {stats.history.map((h, i) => {
              // Calculate percent height against limit of 5000 or max revenue
              const maxVal = Math.max(...stats.history.map(item => item.revenue), 4000);
              const pctHeight = (h.revenue / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip on hover */}
                    <span className="absolute -top-10 scale-0 group-hover:scale-100 bg-slate-900 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono shadow-md z-10 transition-transform duration-100">
                      ₹{h.revenue}
                    </span>
                    <div 
                      className="w-8 sm:w-12 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md group-hover:shadow-blue-200"
                      style={{ height: `${Math.max(pctHeight, 15)}px` }}
                    />
                  </div>
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 font-mono">
                    {h.date.split('-')[2]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Owner Actions Panel (Venue Add Form + Court Add Form) */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => setShowAddVenue(!showAddVenue)}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-slate-950 text-white font-bold text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.01] transition-all"
        >
          <Building className="w-4.5 h-4.5" />
          Register New Arena
        </button>

        {venues.length > 0 && (
          <button
            onClick={() => setShowAddCourt(!showAddCourt)}
            className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.01] transition-all"
          >
            <PlusCircle className="w-4.5 h-4.5 text-blue-400 mr-0.5" />
            Add Sport Court
          </button>
        )}
      </div>

      {/* Register Venue Form Panel Slide */}
      {showAddVenue && (
        <div id="add-venue-form" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md max-w-xl animate-fade-in space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-sans font-extrabold text-slate-900 text-base">Arena Specifications</h4>
            <button onClick={() => setShowAddVenue(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-bold uppercase tracking-wider">Close</button>
          </div>

          {venueSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs border border-emerald-100 rounded-xl font-bold">
              {venueSuccess}
            </div>
          )}

          <form onSubmit={submitVenue} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Arena Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Smash & Shuttle Pro"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Min Base Rate (₹)</label>
                <input 
                  type="number"
                  placeholder="300"
                  value={venuePrice}
                  onChange={(e) => setVenuePrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Description Overview</label>
              <textarea 
                placeholder="Details of artificial turf condition, change rooms, water dispensers..."
                value={venueDesc}
                onChange={(e) => setVenueDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-semibold h-20 resize-none text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Address Detail</label>
                <input 
                  type="text"
                  placeholder="e.g. Lane 3, Kalyan Nagar"
                  value={venueAddr}
                  onChange={(e) => setVenueAddr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Target City</label>
                <select 
                  value={venueCity}
                  onChange={(e) => setVenueCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Unsplash Photo URL</label>
              <input 
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={venueImg}
                onChange={(e) => setVenueImg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block mb-1">Select Club Amenities</label>
              <div className="flex flex-wrap gap-1.5">
                {facilityOptions.map((f) => {
                  const hasFac = facilities.includes(f);
                  return (
                    <button
                      type="button"
                      key={f}
                      onClick={() => toggleFacility(f)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all border ${hasFac ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Submit Venue Application
            </button>
          </form>
        </div>
      )}

      {/* Add New Court Form Slide */}
      {showAddCourt && (
        <div id="add-court-form" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md max-w-xl animate-fade-in space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-sans font-extrabold text-slate-900 text-base">Generate Court and Open Slot calendars</h4>
            <button onClick={() => setShowAddCourt(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-bold uppercase tracking-wider">Close</button>
          </div>

          {courtSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs border border-emerald-100 rounded-xl font-bold">
              {courtSuccess}
            </div>
          )}

          <form onSubmit={submitCourt} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Select Venue Arena</label>
                <select
                  value={courtVenueId}
                  onChange={(e) => setCourtVenueId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                >
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Sport Category</label>
                <select
                  value={courtSportId}
                  onChange={(e) => setCourtSportId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                >
                  {sports.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Court / Turf Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Pitch 1, Court B"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">Price per Hour (₹)</label>
                <input 
                  type="number"
                  placeholder="e.g. 500"
                  value={courtPrice}
                  onChange={(e) => setCourtPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>
            </div>

            <button
               type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Generate Court & Dynamic Hourly Templates
            </button>
          </form>
        </div>
      )}

      {/* 4. Registered Venues List Layout */}
      <div className="space-y-4">
        <h3 className="font-sans font-extrabold text-slate-900 text-lg tracking-tight">Your Court Arena Listings ({venues.length})</h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Syncing arena status...</div>
        ) : venues.length === 0 ? (
          <div className="bg-white border border-slate-200 p-6 rounded-3xl text-center text-slate-400">
            <p className="font-bold text-slate-800 text-sm mb-1">No Arenas Registered</p>
            <p className="text-xs">Select "Register New Arena" above to draft your listing for approval.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in font-sans">
            {venues.map((v) => (
              <div key={v.id} className="bg-white border border-slate-200 rounded-3xl p-5 flex gap-4 hover:shadow-md transition-all hover:border-blue-300">
                <img 
                  src={v.imageUrls[0]} 
                  alt={v.name} 
                  className="w-24 h-24 rounded-2xl object-cover pointer-events-none"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">{v.city}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wide font-extrabold uppercase ${v.isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {v.isApproved ? 'Active' : 'Pending Approval'}
                      </span>
                    </div>
                    <h4 className="font-sans font-extrabold text-slate-900 text-base mt-1 line-clamp-1">{v.name}</h4>
                    <p className="text-xs text-slate-450 truncate mt-0.5 font-medium">{v.address}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-bold text-slate-600 select-none">
                    <span>Base: ₹{v.priceMin}/Hr</span>
                    <span>★ {v.rating} (Avg)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
