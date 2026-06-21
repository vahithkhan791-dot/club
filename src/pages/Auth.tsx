import React, { useState } from 'react';
import { Mail, User, Shield, Sparkles, ArrowRight, UserPlus, Info } from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface AuthProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick Sign In for seed accounts
  const quickSignIn = async (seedEmail: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: seedEmail })
      });
      const data = await response.json();
      if (response.ok) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection refused.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (isRegister && !name) {
      setError('Name is required');
      setIsLoading(false);
      return;
    }

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { email, name, role } : { email };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        if (isRegister) {
          setSuccess('Registration successful! Please login below.');
          setIsRegister(false);
        } else {
          onLoginSuccess(data.user, data.token);
        }
      } else {
        setError(data.error || 'Server error');
      }
    } catch (err) {
      setError('Could not connect to database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-12 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8">
        
        {/* Auth title */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 mb-3 animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-sans font-extrabold text-2xl tracking-tight text-slate-900">
            {isRegister ? 'Join SportSphere' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isRegister ? 'Create your platform account to get playing' : 'Login to book synthetic turfs and court slots.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-100 text-center font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 text-center font-bold">
            {success}
          </div>
        )}

        {/* Regular email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block mb-1">Full Name</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="e.g. Aditya Sen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm pl-10 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold text-slate-950"
                />
                <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block mb-1">Email Address</label>
            <div className="relative">
              <input 
                type="email"
                placeholder="e.g. user@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm pl-10 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold text-slate-950"
              />
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block mb-1">Account Role Type</label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.CUSTOMER)}
                  className={`p-3 rounded-xl text-xs font-bold cursor-pointer border text-center transition-all ${role === UserRole.CUSTOMER ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                  Sportsperson
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.OWNER)}
                  className={`p-3 rounded-xl text-xs font-bold cursor-pointer border text-center transition-all ${role === UserRole.OWNER ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                  Venue Owner
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1 leading-relaxed">
                {role === UserRole.OWNER ? '⚠️ Owner accounts require structural approval from SportSphere Admins before launching slots.' : '✅ Play accounts have immediate instant booking approvals.'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md cursor-pointer tracking-wider uppercase flex items-center justify-center gap-1.5 mt-2 hover:scale-[1.01] active:scale-95 transition-all"
          >
            {isLoading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Change auth mode */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need active credentials? Plan an Account'}
          </button>
        </div>

        {/* Quick Demo Access Credentials */}
        <div className="border-t border-slate-100 pt-5 mt-6">
          <div className="flex items-center gap-1.5 text-xs font-extrabold font-mono tracking-wider text-slate-400 uppercase mb-3 justify-center">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            Platform Demo Quick Access
          </div>

          <div className="space-y-2">
            <button
               onClick={() => quickSignIn('vahithkhan791@gmail.com')}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-rose-250 bg-rose-50/20 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <div className="text-left">
                <span className="font-bold">Vahith Admin (Full Control)</span>
                <p className="text-[10px] text-slate-400">vahithkhan791@gmail.com</p>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-rose-100 text-[9px] font-bold font-mono">ADMIN</div>
            </button>

            <button
              onClick={() => quickSignIn('customer@test.com')}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-blue-150 bg-blue-50/20 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <div className="text-left">
                <span className="font-bold">Aditya Sen (Customer / Bookings)</span>
                <p className="text-[10px] text-slate-400">customer@test.com</p>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-blue-100 text-[9px] font-bold font-mono">CUSTOMER</div>
            </button>

            <button
              onClick={() => quickSignIn('owner1@sportsphere.com')}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <div className="text-left">
                <span className="font-bold">Rajesh Kumar (Partner / Revenue)</span>
                <p className="text-[10px] text-slate-400">owner1@sportsphere.com</p>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-slate-200 text-[9px] font-bold font-mono text-slate-600">OWNER</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
