import React from 'react';
import { Home, Search, MessageSquare, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const BottomNav = ({ active }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t mt-8 z-50">
    <div className="max-w-2xl mx-auto flex justify-around py-3">
      <Link to="/" className={`flex flex-col items-center gap-1 ${active === 'home' ? 'text-blue-600' : 'text-gray-600'}`}>
        <Home className="w-6 h-6" />
        <span className="text-xs">Home</span>
      </Link>
      <Link to="/search" className={`flex flex-col items-center gap-1 ${active === 'search' ? 'text-blue-600' : 'text-gray-600'}`}>
        <Search className="w-6 h-6" />
        <span className="text-xs">Search</span>
      </Link>
      <Link to="/chats" className={`flex flex-col items-center gap-1 ${active === 'chat' ? 'text-blue-600' : 'text-gray-600'}`}>
        <MessageSquare className="w-6 h-6" />
        <span className="text-xs">Chat</span>
      </Link>
      <Link to="/notifications" className={`flex flex-col items-center gap-1 ${active === 'notifications' ? 'text-blue-600' : 'text-gray-600'}`}>
        <Bell className="w-6 h-6" />
        <span className="text-xs">Alerts</span>
      </Link>
      <Link to="/profile" className={`flex flex-col items-center gap-1 ${active === 'profile' ? 'text-blue-600' : 'text-gray-600'}`}>
        <User className="w-6 h-6" />
        <span className="text-xs">Profile</span>
      </Link>
    </div>
  </div>
);

export default BottomNav;