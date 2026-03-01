import React, { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { Loader2, User, Mail, Lock, Shield, CreditCard, Save } from 'lucide-react';
import { captureEvent } from '../lib/posthog';

export const Profile = () => {
  const { user, userData, setUserData } = useUserStore();
  const [displayName, setDisplayName] = useState(userData?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!isFirebaseConfigured) {
        // Mock update
        setUserData({ ...userData, display_name: displayName });
        setSuccessMessage('Profile updated successfully (Demo Mode)');
        setLoading(false);
        return;
      }

      const updates: any = {};
      
      // Update display name in Firestore
      if (displayName !== userData?.display_name) {
        updates.display_name = displayName;
        await updateDoc(doc(db, 'users', user.uid), { display_name: displayName });
        await updateProfile(auth.currentUser!, { displayName });
      }

      // Update email in Auth (requires recent login)
      if (email !== user.email && auth.currentUser) {
        await updateEmail(auth.currentUser, email);
        updates.email = email;
        await updateDoc(doc(db, 'users', user.uid), { email });
      }

      // Update password in Auth (requires recent login)
      if (newPassword && auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      setSuccessMessage('Profile updated successfully');
      captureEvent('profile_updated');
      setNewPassword(''); // Clear password field
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in to change sensitive information like email or password.');
      } else {
        setError(err.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <p className="text-gray-400 mt-2">Manage your profile, subscription, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white/10 text-white rounded-xl font-medium transition-colors">
            <User className="w-5 h-5" />
            <span>Profile Information</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <CreditCard className="w-5 h-5" />
            <span>Billing & Subscription</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-colors">
            <Shield className="w-5 h-5" />
            <span>Security</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 p-4 rounded-xl">
              {successMessage}
            </div>
          )}

          <div className="bg-[#111111] rounded-2xl border border-white/10 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-4xl text-white shadow-lg">
                  {displayName?.charAt(0) || email?.charAt(0) || 'U'}
                </div>
                <div>
                  <button type="button" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-colors">
                    Change Avatar
                  </button>
                  <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Subscription Info Card */}
          <div className="bg-[#111111] rounded-2xl border border-white/10 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Current Plan</h2>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="text-lg font-bold text-white">{userData?.subscription_tier || 'Starter'} Plan</p>
                <p className="text-sm text-gray-400 mt-1">{userData?.credits_balance || 0} credits remaining</p>
              </div>
              <button className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                Manage Billing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
