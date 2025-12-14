import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Users, UserPlus, AtSign, Repeat2, Bell, BellOff, Filter, Trash2 } from 'lucide-react';
import BottomNav from '../../components/common/BottomNav';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const NotificationsScreen = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    // Optimistic
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try {
        await axios.post('/notifications/mark-read', { notificationIds: [id] });
    } catch (error) {
        console.error("Failed to mark read");
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
        await axios.post('/notifications/mark-read', { 
            notificationIds: notifications.filter(n => !n.read).map(n => n._id) 
        });
    } catch (error) {
        console.error("Failed to mark all read");
    }
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif._id);
    const { type, payload, userId } = notif;
    if (type === 'follow') {
        navigate(`/profile/${payload.senderId}`);
    } else if (payload.postId) {
        navigate(`/post/${payload.postId}`);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true;
    if (activeTab === 'mentions') return notif.type === 'mention' || notif.type === 'comment';
    if (activeTab === 'follows') return notif.type === 'follow';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500 fill-current" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Mark all read
                </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 px-4 pb-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'mentions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveTab('follows')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'follows'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Follows
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white">
          {loading ? <div className="p-10 text-center">Loading...</div> : filteredNotifications.length > 0 ? (
            <div>
              {filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 relative group ${
                    !notif.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {notif.payload.senderAvatar ? (
                        <img src={notif.payload.senderAvatar} className="w-12 h-12 rounded-full object-cover"/>
                    ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                           {notif.payload.senderUsername?.[0].toUpperCase()}
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-bold">{notif.payload.senderUsername}</span>{' '}
                      <span className="text-gray-700">
                          {notif.type === 'like' && 'liked your post'}
                          {notif.type === 'comment' && 'commented on your post'}
                          {notif.type === 'follow' && 'started following you'}
                      </span>
                    </p>
                    {notif.payload.commentText && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1 italic">
                        "{notif.payload.commentText}"
                      </p>
                    )}
                    <span className="text-xs text-gray-400 mt-1 inline-block">
                      {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  {/* Post Thumbnail */}
                  {notif.payload.postImage && (
                    <img src={notif.payload.postImage} className="w-12 h-12 rounded bg-gray-200 object-cover flex-shrink-0"/>
                  )}

                  {/* Unread Indicator */}
                  {!notif.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                 All caught up!
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="notifications" />
    </div>
  );
};

export default NotificationsScreen;