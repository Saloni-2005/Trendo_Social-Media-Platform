import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Bell, LogOut, ChevronRight, Shield, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth(); // Assuming updateUser updates local context
  const [isPrivate, setIsPrivate] = useState(user?.settings?.private || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sync with user state if it changes
    if (user?.settings?.private !== undefined) {
        setIsPrivate(user.settings.private);
    }
  }, [user]);

  const handlePrivacyToggle = async () => {
    try {
      setLoading(true);
      const newValue = !isPrivate;
      
      // Optimistic update
      setIsPrivate(newValue);

      await axios.put(`/users/${user._id}/settings`, {
        settings: { private: newValue }
      });

      // Update context/local storage if needed
      if (updateUser) {
          updateUser({ settings: { ...user.settings, private: newValue } });
      }
      
      toast.success(newValue ? "Account is now Private" : "Account is now Public");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update settings");
      setIsPrivate(!isPrivate); // Revert
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
        logout();
        navigate('/login');
    }
  };

  const SettingsItem = ({ icon: Icon, title, subtitle, onClick, toggle, checked }) => (
    <div 
        onClick={onClick}
        className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-gray-100 rounded-lg">
            <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      
      {toggle ? (
        <button 
            className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </button>
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-400" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
        
        {/* Account Privacy */}
        <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Privacy</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <SettingsItem 
                    icon={Lock} 
                    title="Private Account" 
                    subtitle="Only followers can see your photos and videos"
                    toggle 
                    checked={isPrivate}
                    onClick={handlePrivacyToggle}
                />
                <SettingsItem 
                    icon={Shield} 
                    title="Security" 
                    subtitle="Password, 2FA, Login Activity"
                    onClick={() => toast('Coming soon')}
                />
            </div>
        </section>

        {/* Notifications */}
        <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Preferences</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <SettingsItem 
                    icon={Bell} 
                    title="Notifications" 
                    onClick={() => navigate('/notifications')}
                />
                <SettingsItem 
                    icon={HelpCircle} 
                    title="Help & Support" 
                    onClick={() => toast('Coming soon')}
                />
            </div>
        </section>

        {/* Login */}
        <section>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div 
                    onClick={handleLogout}
                    className="flex items-center gap-4 p-4 text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-bold">Log Out</span>
                </div>
            </div>
        </section>

        <p className="text-center text-xs text-gray-400 mt-8">
            Trendo v1.0.0
        </p>

      </div>
    </div>
  );
};

export default SettingsScreen;
