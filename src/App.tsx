import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Explore from './pages/Explore';
import VenueDetail from './pages/VenueDetail';
import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { User, UserRole } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('explore');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [appInitializing, setAppInitializing] = useState(true);

  // Auto Sign-in with session storage keys if present
  useEffect(() => {
    const savedToken = localStorage.getItem('s_token');
    if (savedToken) {
      verifyToken(savedToken);
    } else {
      setAppInitializing(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('s_token');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAppInitializing(false);
    }
  };

  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('s_token', token);
    
    // Smooth redirect based on Roles: admin goes to control, owner to cockpit, customer to slots feed!
    if (user.role === UserRole.ADMIN) {
      setCurrentPage('admin-dashboard');
    } else if (user.role === UserRole.OWNER) {
      setCurrentPage('owner-dashboard');
    } else {
      setCurrentPage('explore');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('s_token');
    setCurrentPage('explore');
  };

  const handleSelectVenueId = (id: string) => {
    setSelectedVenueId(id);
    setCurrentPage('venue-detail');
  };

  if (appInitializing) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex flex-col items-center justify-center gap-2 select-none">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <h3 className="font-display font-bold text-gray-900 text-lg mt-2">SportSphere Platform</h3>
        <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Initializing schedules...</p>
      </div>
    );
  }

  // Render correct page canvas inside wrapper Layout frame
  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
    >
      {currentPage === 'auth' && (
        <Auth onLoginSuccess={handleLoginSuccess} />
      )}
      
      {currentPage === 'explore' && (
        <Explore 
          onSelectVenueId={handleSelectVenueId} 
          onPageChange={setCurrentPage}
          currentUser={currentUser}
        />
      )}

      {currentPage === 'venue-detail' && (
        <VenueDetail 
          venueId={selectedVenueId} 
          onPageChange={setCurrentPage}
          currentUser={currentUser}
        />
      )}

      {currentPage === 'user-dashboard' && (
        <UserDashboard 
          currentUser={currentUser} 
          onPageChange={setCurrentPage} 
          onSelectVenueId={handleSelectVenueId}
        />
      )}

      {currentPage === 'owner-dashboard' && (
        <OwnerDashboard currentUser={currentUser} />
      )}

      {currentPage === 'admin-dashboard' && (
        <AdminDashboard currentUser={currentUser} />
      )}
    </Layout>
  );
}
