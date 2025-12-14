import React, { useState, useEffect } from 'react';
import { Search, Hash, TrendingUp, X, Clock, MapPin, Users, Image as ImageIcon, Heart, MessageCircle } from 'lucide-react';
import BottomNav from '../../components/common/BottomNav';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('top');
  const [recentSearches, setRecentSearches] = useState([]); // Could persist to localStorage
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [explorePosts, setExplorePosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load explore posts initially
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      // Using home feed as explore for now. Ideally should be a separate 'explore' endpoint (e.g. random or popular)
      const res = await axios.get('/posts/feed/home');
      setExplorePosts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const usersRes = await axios.get(`/users/search?query=${query}`);
      // Simple post search by text if API supported, for now assume users mainly
      // Or filter explore posts client side
      
      setSearchResults({
        users: usersRes.data,
        posts: [] // Post search API not implemented, leaving empty or could search explorePosts
      });

      if (!recentSearches.includes(query)) {
        setRecentSearches([query, ...recentSearches.slice(0, 4)]);
      }
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetId, isFollowing) => {
    try {
      const endpoint = isFollowing ? `/users/${targetId}/unfollow` : `/users/${targetId}/follow`;
      await axios.post(endpoint);
      
      // Update local state in searchResults
      setSearchResults(prev => ({
        ...prev,
        users: prev.users.map(u => {
          if (u._id === targetId) {
             const updatedFollowers = isFollowing 
                ? (u.followers || []).filter(id => id !== user._id)
                : [...(u.followers || []), user._id];
             return { ...u, followers: updatedFollowers, followersCount: updatedFollowers.length };
          }
          return u;
        })
      }));
      toast.success(isFollowing ? "Unfollowed" : "Followed");
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const clearAllSearches = () => setRecentSearches([]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto bg-white min-h-screen flex flex-col">
        {/* Header with Search */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Search users..."
                className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                      setSearchQuery('');
                      setSearchResults({ users: [], posts: [] });
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
             <div className="flex border-t border-gray-200">
                <button
                   onClick={() => setActiveTab('users')}
                   className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
                >
                  Users
                </button>
                <button
                   onClick={() => setActiveTab('top')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'top' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
                >
                   All
                </button>
             </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1">
          {loading ? (
             <div className="text-center py-10">Searching...</div>
          ) : !searchQuery ? (
            /* Explore / Default View */
            <div>
               {recentSearches.length > 0 && (
                   <div className="mb-6">
                       <div className="flex justify-between items-center mb-2">
                           <h3 className="text-sm font-bold text-gray-900">Recent</h3>
                           <button onClick={clearAllSearches} className="text-blue-500 text-sm">Clear All</button>
                       </div>
                       {recentSearches.map((s, i) => (
                           <div key={i} className="py-2 px-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2" onClick={() => { setSearchQuery(s); handleSearch(s); }}>
                               <Clock className="w-4 h-4 text-gray-400"/>
                               <span>{s}</span>
                           </div>
                       ))}
                   </div>
               )}
               <h3 className="text-sm font-bold text-gray-900 mb-3">Explore</h3>
               <div className="grid grid-cols-3 gap-1">
                   {explorePosts.map(post => (
                       <Link to={`/post/${post._id}`} key={post._id} className="aspect-square bg-gray-200 relative group overflow-hidden">
                           {post.media?.[0] && <img src={post.media[0].url} className="w-full h-full object-cover"/>}
                           {/* Hover effect */}
                           <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white gap-2 transition-opacity">
                                <Heart className="w-4 h-4 fill-white"/> {post.likesCount}
                           </div>
                       </Link>
                   ))}
               </div>
            </div>
          ) : (
            /* Search Results */
            <div>
               {activeTab === 'users' || activeTab === 'top' ? (
                   <div className="space-y-4">
                       {searchResults.users.length === 0 && <p className="text-gray-500 text-center">No users found</p>}
                       {searchResults.users.map(u => {
                           const isMe = u._id === user?._id;
                           const isFollowing = u.followers?.includes(user?._id);
                           
                           return (
                               <div key={u._id} className="flex items-center justify-between">
                                   <Link to={`/profile/${u._id}`} className="flex items-center gap-3 flex-1">
                                       {u.avatarUrl ? (
                                           <img src={u.avatarUrl} className="w-12 h-12 rounded-full object-cover"/>
                                       ) : (
                                           <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                               {u.username[0].toUpperCase()}
                                           </div>
                                       )}
                                       <div>
                                           <p className="font-bold text-gray-900">{u.username}</p>
                                           <p className="text-gray-500 text-sm">{u.displayName}</p>
                                       </div>
                                   </Link>
                                   {!isMe && (
                                       <button 
                                          onClick={() => handleFollow(u._id, isFollowing)}
                                          className={`px-4 py-1.5 rounded-lg text-sm font-medium ${isFollowing ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'}`}
                                       >
                                           {isFollowing ? 'Following' : 'Follow'}
                                       </button>
                                   )}
                               </div>
                           );
                       })}
                   </div>
               ) : null}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="search" />
    </div>
  );
};

export default SearchScreen;