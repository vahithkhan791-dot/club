import { useState } from 'react';
import { Sparkles, ArrowRight, TrendingUp, AlertTriangle, Lightbulb, MapPin, DollarSign } from 'lucide-react';
import { AIRecommendation, Venue } from '../types';

interface AIConciergeProps {
  onSelectVenueId: (venueId: string) => void;
  onPageChange: (page: string) => void;
  currentUser: { id: string } | null;
}

export default function AIConcierge({ onSelectVenueId, onPageChange, currentUser }: AIConciergeProps) {
  const [sport, setSport] = useState('Cricket');
  const [budget, setBudget] = useState('1000');
  const [city, setCity] = useState('Bengaluru');
  const [priority, setPriority] = useState('Value for Money');
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sportsList = ['Cricket', 'Football', 'Badminton', 'Tennis', 'Basketball', 'Volleyball'];
  const priorities = ['Value for Money', 'Peak Ratings First', 'Locker Room & Luxury Access'];

  const handleRecommend = async () => {
    setIsLoading(true);
    setError('');
    setRecommendations([]);

    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.id || ''}`
        },
        body: JSON.stringify({
          preferredSport: sport,
          maxBudget: Number(budget),
          city: city,
          priority: priority
        })
      });

      if (!response.ok) {
        throw new Error('Our AI agent is currently analyzing slot trends. Please try again.');
      }

      const data = await response.json();
      setRecommendations(data);
    } catch (err: any) {
      setError(err?.message || 'Server context failed. Let us try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0b0f19] rounded-3xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden select-none border border-slate-800">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-slate-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 font-bold text-[10px] tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            SportSphere AI Concierge
          </div>
          <h2 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-white mb-2 leading-tight">
            Predict popular times, find matching arenas.
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Our customized Gemini model matches your sport preference, budget targets, and location constraints to deliver high-quality recommendations.
          </p>
        </div>

        {/* AI Selection Form */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 w-full lg:max-w-md flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block mb-1">Sport Type</label>
              <select 
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {sportsList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block mb-1">Max Budget (₹/Hr)</label>
              <input 
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block mb-1">Preferred City</label>
              <input 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 font-medium"
                placeholder="e.g. Bengaluru"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block mb-1">Core Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleRecommend}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-transform duration-100 hover:scale-[1.01]"
          >
            {isLoading ? 'Gemini is Thinking...' : 'Get AI Match'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recommendations Output Area */}
      {(recommendations.length > 0 || isLoading || error) && (
        <div className="mt-8 border-t border-white/10 pt-6 relative z-10">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-10 h-10 border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-sm text-slate-300 font-mono text-center">SportSphere AI Agent compiling real-time rates and weather forecasts...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/20 rounded-xl border border-red-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {recommendations.length > 0 && !isLoading && (
            <div>
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-sky-300" />
                Gemini Personalized Recommendations:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec, i) => (
                  <div 
                    key={i} 
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-400/40 hover:bg-white/10 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-blue-400 font-mono">{rec.sportName} Match</span>
                          <h4 className="font-sans font-extrabold text-base text-white">{rec.venueName}</h4>
                        </div>
                        <div className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold font-mono text-xs">
                          {rec.matchScore}% Match
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
                        "{rec.reason}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{rec.availableSlotsToday} Slots Today</span>
                      </div>
                      <button
                        onClick={() => {
                          onSelectVenueId(rec.venueId);
                          onPageChange('venue-detail');
                        }}
                        className="py-1.5 px-3 rounded-lg bg-blue-500/20 hover:bg-blue-600 text-blue-200 hover:text-white text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
