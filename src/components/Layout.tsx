import React, { useState, useEffect } from 'react';
import { 
  Home, User, Bell, LogOut, Shield, Activity, Sparkles, X, Check, Mail 
} from 'lucide-react';
import { User as UserType, UserRole, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: UserType | null;
  onLogout: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({ 
  children, 
  currentUser, 
  onLogout, 
  currentPage, 
  onPageChange 
}: LayoutProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationList, setShowNotificationList] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user notifications if logged in
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${currentUser?.id}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser?.id}` }
      });
      if (response.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans transition-colors duration-300">
      {/* Platform Header */}
      <nav id="navbar" className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => onPageChange('explore')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100 transition-transform duration-300 group-hover:scale-105">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <div>
              <span className="font-sans font-extrabold text-xl tracking-tight text-slate-900">
                Sport<span className="text-blue-600">Sphere</span>
              </span>
              <p className="text-[9px] text-slate-400 tracking-wider uppercase font-semibold font-mono">Premium Arena Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Main Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => onPageChange('explore')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${currentPage === 'explore' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Home className="w-4 h-4" />
                Explore
              </button>
              
              {currentUser && (
                <>
                  <button 
                    onClick={() => onPageChange('user-dashboard')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${currentPage === 'user-dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <User className="w-4 h-4" />
                    My Bookings
                  </button>

                  {(currentUser.role === UserRole.OWNER || currentUser.role === UserRole.ADMIN) && (
                    <button 
                      onClick={() => onPageChange('owner-dashboard')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${currentPage === 'owner-dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Activity className="w-4 h-4" />
                      Venues
                    </button>
                  )}

                  {currentUser.role === UserRole.ADMIN && (
                    <button 
                      onClick={() => onPageChange('admin-dashboard')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${currentPage === 'admin-dashboard' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-rose-50/20 hover:text-rose-600'}`}
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Notification Tray & User Account */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* Notification Trigger Bell */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowNotificationList(!showNotificationList);
                      if (!showNotificationList) markNotificationsAsRead();
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors relative cursor-pointer border border-slate-200"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown notifications list */}
                  {showNotificationList && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Notifications</span>
                        <button 
                          onClick={() => setNotifications([])}
                          className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto px-1">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs font-mono">
                            No notifications to display
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              className={`p-3 rounded-xl mb-1 cursor-pointer transition-colors text-xs ${notif.isRead ? 'hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50'}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`p-1.5 rounded-lg mt-0.5 ${
                                  notif.type === 'booking' ? 'bg-emerald-100 text-emerald-700' :
                                  notif.type === 'cancellation' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{notif.title}</p>
                                  <p className="text-slate-500 leading-relaxed mt-0.5">{notif.message}</p>
                                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Widget Badge */}
                <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-blue-600 font-extrabold text-sm font-sans">
                    {currentUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                    <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase font-extrabold">
                      {currentUser.role} Member
                    </span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors ml-1"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => onPageChange('auth')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-blue-200 cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Sub-Header Navigation for Small Screens */}
      {currentUser && (
        <div className="md:hidden bg-white border-b border-gray-100 flex items-center justify-around py-2.5 px-2 sticky top-[65px] z-30">
          <button 
            onClick={() => onPageChange('explore')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${currentPage === 'explore' ? 'text-indigo-600' : 'text-gray-500'}`}
          >
            <Home className="w-4.5 h-4.5" />
            Explore
          </button>
          <button 
            onClick={() => onPageChange('user-dashboard')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${currentPage === 'user-dashboard' ? 'text-indigo-600' : 'text-gray-500'}`}
          >
            <User className="w-4.5 h-4.5" />
            Bookings
          </button>
          {(currentUser.role === UserRole.OWNER || currentUser.role === UserRole.ADMIN) && (
            <button 
              onClick={() => onPageChange('owner-dashboard')}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${currentPage === 'owner-dashboard' ? 'text-indigo-600' : 'text-gray-500'}`}
            >
              <Activity className="w-4.5 h-4.5" />
              Manage
            </button>
          )}
          {currentUser.role === UserRole.ADMIN && (
            <button 
              onClick={() => onPageChange('admin-dashboard')}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${currentPage === 'admin-dashboard' ? 'text-red-600' : 'text-gray-500'}`}
            >
              <Shield className="w-4.5 h-4.5" />
              Admin
            </button>
          )}
        </div>
      )}

      {/* Primary Canvas Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
        {children}
      </main>

      {/* Platform Branding Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center select-none mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 justify-center md:justify-start">
            <span className="font-display font-semibold text-sm tracking-tight text-gray-900">
              Sport<span className="text-indigo-600">Sphere</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-400">Your Court is Waiting</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} SportSphere Inc. All Rights Reserved. Crafted with React, Express, and Google GenAI.
          </p>
        </div>
      </footer>
    </div>
  );
}
