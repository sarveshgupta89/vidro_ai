import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  Video, 
  Image as ImageIcon, 
  Clock, 
  LayoutTemplate, 
  LogOut, 
  HelpCircle, 
  FileText, 
  Shield 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const { user, userData, setUser, setUserData } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!isFirebaseConfigured) {
      setUser(null);
      setUserData(null);
      navigate('/login');
      return;
    }
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Long Form Videos', path: '/', icon: Video },
    { name: 'Assets', path: '/assets', icon: ImageIcon },
    { name: '5-second Templates', path: '/templates-5s', icon: Clock },
    { name: 'View All Templates', path: '/templates', icon: LayoutTemplate },
  ];

  const footerItems = [
    { name: 'Help', path: '/help', icon: HelpCircle },
    { name: 'Terms & Conditions', path: '/terms-and-conditions', icon: FileText },
    { name: 'Privacy Policy', path: '/privacy-policy', icon: Shield },
  ];

  return (
    <div className="w-64 h-screen bg-[#111111] text-white flex flex-col border-r border-white/10">
      {/* User Profile & Credits Widget */}
      <div className="p-6 border-b border-white/10">
        <div 
          onClick={() => navigate('/profile')}
          className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-lg">
            {userData?.display_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-medium text-sm truncate w-36">
              {userData?.display_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-400">{userData?.subscription_tier || 'Starter'}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Credits</span>
            <span className="font-mono font-bold text-emerald-400">
              {userData?.credits_balance ?? 0}
            </span>
          </div>
          <button 
            onClick={() => navigate('/upgrade')}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-white/10 space-y-1">
        {footerItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive 
                  ? "text-white" 
                  : "text-gray-400 hover:text-white"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.name}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors mt-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
