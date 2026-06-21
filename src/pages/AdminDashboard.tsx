import { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, AlertTriangle, Building, Sparkles, 
  Trash, Users, DollarSign, Activity, FileCheck, Check, ArrowRight 
} from 'lucide-react';
import { Venue, RevenueAnalytics } from '../types';

interface AdminDashboardProps {
  currentUser: { id: string } | null;
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [stats, setStats] = useState<RevenueAnalytics | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch entire venues (approved + pending)
      const res = await fetch('/api/owner/venues', {
        headers: {
          'Authorization': `Bearer ${currentUser?.id}`
        }
      });
      if (res.ok) {
        setVenues(await res.json());
      }

      // 2. Fetch full system analytics
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

  const handleApproveVenue = async (venueId: string) => {
    try {
      const res = await fetch(`/api/admin/venues/${venueId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser?.id}`
        }
      });

      if (res.ok) {
        setSuccessMsg('Sports arena approved and launched live successfully!');
        fetchAdminData(); // Refresh list to catch approval logs
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingList = venues.filter(v => !v.isApproved);
  const approvedList = venues.filter(v => v.isApproved);

  return (
    <div className="space-y-8 select-none">
      
      {/* 1. Admin Shield Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden select-none border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-red-500/10 blur-3xl" />
        <div className="max-w-xl relative p-1 z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 font-semibold text-xs tracking-wider uppercase font-mono">
            <Shield className="w-4 h-4 text-red-400" />
            SportSphere Master Control Deck
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
            System Administration
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Manage partner applications, authorize sports turfs, watch real-time payment capture rates, and maintain global configurations.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 font-semibold text-center select-none animate-bounce">
          {successMsg}
        </div>
      )}

      {/* 2. Platform global statistics logs */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total System Revs</span>
              <p className="text-2xl font-bold font-mono text-blue-600 mt-1">₹{stats.totalRevenue}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Reservations</span>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{stats.bookingsCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-2xl text-red-650">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Average Occupancy</span>
              <p className="text-2xl font-bold font-mono text-blue-600 mt-1">{stats.occupancyRate}%</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <FileCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Popular Category</span>
              <p className="text-base font-bold text-slate-900 mt-1 truncate">{stats.popularSport}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-650 animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* 3. Pending Partner Applications Row */}
      <div className="space-y-4">
        <h3 className="font-sans font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
          Pending Partner Arena Approvals ({pendingList.length})
        </h3>

        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading master files...</div>
        ) : pendingList.length === 0 ? (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs text-slate-400 text-center font-mono">
            No pending partner applications. All setups are live and active!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {pendingList.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden p-5 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all">
                <div className="space-y-3.5">
                  <div className="relative h-32 rounded-2xl overflow-hidden pointer-events-none">
                    <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-amber-500 text-white font-extrabold uppercase font-mono text-[8px] px-2 py-0.5 rounded-full">
                      Pending Action
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">{p.city}</span>
                    <h4 className="font-sans font-extrabold text-slate-900 text-base leading-tight mt-0.5">{p.name}</h4>
                    <p className="text-xs text-slate-400 font-semibold truncate leading-none mt-1">↳ {p.address}</p>
                    <p className="text-[11px] text-slate-500 italic mt-2.5 line-clamp-2">
                      "{p.description}"
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900">Base: ₹{p.priceMin}/Hr</span>
                  <button
                    onClick={() => handleApproveVenue(p.id)}
                    className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-emerald-600 text-white font-bold text-xs tracking-wider uppercase shadow-md flex items-center gap-1 cursor-pointer transition-colors animate-pulse"
                  >
                    <Check className="w-4 h-4" />
                    Approve Arena
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Live Arenas Log Column */}
      <div className="space-y-4 pt-4">
        <h3 className="font-sans font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          Active Live Arenas Registry ({approvedList.length})
        </h3>
        {approvedList.length === 0 ? (
          <p className="text-xs text-slate-400 font-mono">No live stadium setups loaded.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedList.map((a) => (
              <div key={a.id} className="p-4 bg-white border border-slate-200 rounded-3xl flex gap-3.5 items-center select-none hover:shadow-xs transition-shadow hover:border-blue-200">
                <img src={a.imageUrls[0]} alt={a.name} className="w-14 h-14 rounded-2xl object-cover pointer-events-none" />
                <div>
                  <span className="text-[9px] uppercase font-bold font-mono tracking-widest text-slate-400">{a.city}</span>
                  <h4 className="font-sans font-extrabold text-slate-900 text-sm">{a.name}</h4>
                  <span className="text-[9px] text-slate-400 font-mono font-bold mt-0.5 block">STARS: {a.rating} Avg</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
