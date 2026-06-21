import { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, Filter, ShieldCheck, ArrowRight, Activity, Flame } from 'lucide-react';
import { Venue, Sport } from '../types';
import StarRating from '../components/StarRating';
import AIConcierge from '../components/AIConcierge';

interface ExploreProps {
  onSelectVenueId: (id: string) => void;
  onPageChange: (page: string) => void;
  currentUser: { id: string } | null;
}

export default function Explore({ onSelectVenueId, onPageChange, currentUser }: ExploreProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  
  // Search state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportId, setSelectedSportId] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [maxPrice, setMaxPrice] = useState(1500);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSports();
    fetchVenues();
  }, [selectedSportId, selectedCity, maxPrice]); // Fetch when filters change

  const fetchSports = async () => {
    try {
      const response = await fetch('/api/sports');
      if (response.ok) {
        setSports(await response.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      let url = `/api/venues?maxPrice=${maxPrice}`;
      if (selectedCity) url += `&city=${selectedCity}`;
      if (selectedSportId) url += `&sportId=${selectedSportId}`;
      if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(url);
      if (response.ok) {
        setVenues(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSportId('');
    setSelectedCity('');
    setMaxPrice(1500);
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* 1. Header Hero Panel */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden relative select-none border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 font-bold font-mono text-[10px] uppercase tracking-wider border border-blue-500/30">
            <Flame className="w-3.5 h-3.5 text-blue-400" />
            Book Court Slots Instantly
          </div>
          <h1 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight">
            Book Turf & Sport Arenas in Your City
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Instant booking, real-time hours available, verified grass ratings, secure integrations, and personalized recommendations.
          </p>
        </div>

        {/* Floating Input Search */}
        <div className="relative z-10 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 mt-8 flex flex-col md:flex-row gap-3 max-w-4xl">
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by arena, address, landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchVenues()}
              className="w-full bg-[#0F172A] text-white p-3 rounded-xl text-xs pl-10 focus:ring-1 focus:ring-blue-500 font-medium placeholder-slate-400 border border-slate-800"
            />
          </div>

          <div className="w-full md:w-48 relative flex items-center">
            <MapPin className="absolute left-3 w-4.5 h-4.5 text-slate-400" />
            <select 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#0F172A] text-white border border-slate-800 rounded-xl p-3 text-xs pl-9 focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="">All Cities</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          <button 
            onClick={fetchVenues}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            Find Slots
          </button>
        </div>
      </div>

      {/* 2. Intelligent AI Concierge Module */}
      <AIConcierge 
        onSelectVenueId={onSelectVenueId} 
        onPageChange={onPageChange}
        currentUser={currentUser}
      />

      {/* 3. Sport Quick Select Filters */}
      <div className="space-y-4">
        <h3 className="font-sans font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
          Select Your Sport Category
        </h3>
        <div className="flex flex-wrap gap-2 animate-fade-in">
          <button
            onClick={() => setSelectedSportId('')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all duration-200 ${
              selectedSportId === '' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-102' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/50'
            }`}
          >
            All Sports
          </button>
          {sports.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSportId(s.id)}
              className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider cursor-pointer border flex items-center gap-1.5 transition-all duration-200 ${
                selectedSportId === s.id 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-102' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/50'
              }`}
            >
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Filter parameters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filters Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-500" />
              Adjust Filters
            </span>
            <button 
              onClick={clearFilters}
              className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Pricing Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
              <span>Max Price (₹/Hr)</span>
              <span className="font-mono text-blue-600 font-bold">₹{maxPrice}</span>
            </div>
            <input 
              type="range"
              min="200"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-grab"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex gap-2.5 items-start text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              All displayed stadiums are fully verified and approved by the SportSphere Quality Council.
            </p>
          </div>
        </div>

        {/* Right Venues List Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Showing <span className="text-slate-800 font-black">{venues.length}</span> sports arenas available
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm animate-pulse space-y-3">
                  <div className="bg-slate-100 h-44 rounded-2xl w-full" />
                  <div className="space-y-2">
                    <div className="bg-slate-100 h-4 w-3/4 rounded" />
                    <div className="bg-slate-100 h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : venues.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl py-12 text-center text-slate-400">
              <p className="font-bold text-slate-800 text-sm mb-1">No Sports Venues Found</p>
              <p className="text-xs font-mono">Adjust your pricing slider or select another city/sport option.</p>
              <button 
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs cursor-pointer hover:bg-blue-100 transition-colors"
              >
                Reset Filter Options
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {venues.map((venue) => (
                <div 
                  key={venue.id} 
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-300 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={venue.imageUrls[0]} 
                      alt={venue.name} 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider text-slate-800 shadow-sm flex items-center gap-1 border border-slate-100">
                      <span className="text-amber-500">★</span> {venue.rating}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex gap-1 items-center text-[10px] font-bold tracking-wider uppercase text-slate-400 font-mono">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>{venue.city}</span>
                      </div>
                      <h4 className="font-sans font-extrabold text-slate-900 text-lg group-hover:text-blue-600 transition-colors tracking-tight mt-1 mb-1.5 leading-snug">
                        {venue.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-1 mb-3 truncate leading-relaxed">
                        {venue.address}
                      </p>
                      
                      {/* Facilities pill logs */}
                      <div className="flex flex-wrap gap-1 mb-4 select-none">
                        {venue.facilities.slice(0, 3).map((f, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide border border-slate-200">
                            {f}
                          </span>
                        ))}
                        {venue.facilities.length > 3 && (
                          <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-200 font-mono">
                            +{venue.facilities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 font-mono tracking-wider">Hourly Price</span>
                        <p className="text-xs font-bold text-slate-500 font-mono leading-none mt-0.5">
                          From <span className="text-lg font-black text-blue-600">₹{venue.priceMin}</span>/Hr
                        </p>
                      </div>

                      <button
                        onClick={() => onSelectVenueId(venue.id)}
                        className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm shadow-slate-100 hover:shadow-lg hover:shadow-blue-100"
                      >
                        Book
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
