import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Pin, Archive, Trash2, User } from 'lucide-react';
import BottomNav from '../../components/common/BottomNav';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ChatListScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await axios.get('/chat/conversations');
      setChats(res.data.conversations);
    } catch (error) {
      console.error("Error fetching chats", error);
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (participants) => {
    if (!participants || !user) return null;
    return participants.find(p => p._id !== user._id) || participants[0];
  };

  const filteredChats = chats.filter(chat => {
    const otherUser = getOtherParticipant(chat.participants);
    const name = otherUser?.username || 'Unknown';
    const lastMsg = chat.lastMessage?.content || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           lastMsg.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <Link 
              to="/search"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-white">
          {filteredChats.length > 0 ? (
            <div>
              {filteredChats.map((chat) => {
                const otherUser = getOtherParticipant(chat.participants);
                return (
                    <div key={chat._id} className="relative">
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleChatClick(chat._id)}
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {otherUser?.avatarUrl ? (
                              <img src={otherUser.avatarUrl} alt={otherUser.username} className="w-14 h-14 rounded-full object-cover"/>
                          ) : (
                               <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
                                  <User className="w-8 h-8 text-gray-500" />
                               </div>
                          )}
                        </div>

                        {/* Chat Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <p className="font-medium truncate text-gray-900">
                              {otherUser?.username || 'Unknown'}
                            </p>
                            <span className="text-xs flex-shrink-0 ml-2 text-gray-500">
                              {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                          </div>
                          <p className="text-sm truncate text-gray-600">
                             {chat.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-500 mb-4">Start a conversation with your friends</p>
              <Link to="/search" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block">
                Find People
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="chat" />
    </div>
  );
};

export default ChatListScreen;

