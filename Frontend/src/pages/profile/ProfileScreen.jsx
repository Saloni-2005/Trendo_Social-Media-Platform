import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MoreHorizontal, Image, Settings, Grid, Bookmark, User as UserIcon, Heart, MessageCircle } from 'lucide-react';
import BottomNav from '../../components/common/BottomNav';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import LazyImage from '../../components/common/LazyImage';
import FollowersListModal from './FollowersListModal';

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, title: '' });
  
  const { userId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Use current user ID if no param provided
  const targetUserId = userId || user?._id;
  const isOwnProfile = user && targetUserId === user._id;

  useEffect(() => {
    if (targetUserId) {
      if (activeTab === 'saved' && isOwnProfile) {
          fetchSavedPosts();
      } else {
          fetchProfileData();
      }
    }
  }, [targetUserId, activeTab]);

  const fetchSavedPosts = async () => {
      try {
          const res = await axios.get(`/posts/saved/${targetUserId}`);
          setSavedPosts(res.data);
      } catch (error) {
          console.error("Error fetching saved posts", error);
      }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [userRes, postsRes] = await Promise.all([
        axios.get(`/users/${targetUserId}`),
        axios.get(`/posts/user/${targetUserId}`)
      ]);
      setProfile(userRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      console.error("Error fetching profile", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const isFollowing = profile?.followers?.includes(user?._id);

  const handleFollowToggle = async () => {
    if (!user) return navigate('/login');
    
    try {
      const endpoint = isFollowing ? `/users/${targetUserId}/unfollow` : `/users/${targetUserId}/follow`;
      await axios.post(endpoint);
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        followersCount: isFollowing ? (prev.followersCount || 1) - 1 : (prev.followersCount || 0) + 1,
        followers: isFollowing 
           ? prev.followers.filter(id => id !== user._id)
           : [...(prev.followers || []), user._id]
      }));
      
      toast.success(isFollowing ? "Unfollowed" : "Followed");
    } catch (error) {
      console.error("Follow error", error);
      toast.error("Action failed");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!profile) return <div className="flex justify-center items-center min-h-screen">User not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">{profile.username}</h2>
            <div className="flex gap-2">
                {isOwnProfile && (
                     <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg text-red-500 text-sm font-medium transition-colors">
                        Logout
                     </button>
                )}
                <button 
                    onClick={() => toast('Options menu coming soon!')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-700" />
                </button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          {/* Avatar and Stats */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
              {profile.avatarUrl ? (
                <LazyImage src={profile.avatarUrl} alt={profile.username} className="w-24 h-24 rounded-full border-4 border-white relative z-10 object-cover"/>
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-4 border-white relative z-10 flex items-center justify-center text-white text-3xl font-bold">
                    {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 grid grid-cols-3 gap-4 text-center">
              <div className="cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-all hover:scale-105">
                <p className="text-xl font-bold text-gray-900">{posts.length}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Posts</p>
              </div>
              <div 
                className="cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-all hover:scale-105"
                onClick={() => setModalConfig({ isOpen: true, type: 'followers', title: 'Followers' })}
              >
                <p className="text-xl font-bold text-gray-900">
                  {(profile.followersCount || profile.followers?.length) || 0}
                </p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Followers</p>
              </div>
              <div 
                className="cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-all hover:scale-105"
                onClick={() => setModalConfig({ isOpen: true, type: 'following', title: 'Following' })}
              >
                <p className="text-xl font-bold text-gray-900">
                    {(profile.followingCount || profile.following?.length) || 0}
                </p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Following</p>
              </div>
            </div>
          </div>

          {/* Name and Bio */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1">
              {profile.displayName || profile.username}
            </h3>
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-line leading-relaxed">
              {profile.bio}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isOwnProfile ? (
                 <button
                  onClick={() => navigate('/settings')} // Placeholder or actual settings page
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-lg font-semibold text-gray-800 transition-colors"
                >
                  Edit Profile
                </button>
            ) : (
                <>
                    <button
                      onClick={handleFollowToggle}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition-all shadow-sm ${
                        isFollowing
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={() => {
                        // Create conversation and navigate
                         axios.post('/chat/conversations', { participantId: targetUserId })
                           .then(res => {
                               navigate(`/chat/${res.data.conversation._id}`);
                           })
                           .catch(err => toast.error("Could not start chat"));
                      }}
                      className="flex-1 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      Message
                    </button>
                </>
            )}
            
            <button
              onClick={() => navigate('/settings')} // Navigate to settings
              className="px-4 border border-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-100 sticky top-[60px] bg-white z-10">
          <div className="flex">
            {[
              { id: 'posts', icon: Grid, label: 'POSTS' },
              { id: 'saved', icon: Bookmark, label: 'SAVED', condition: isOwnProfile },
              { id: 'tagged', icon: UserIcon, label: 'TAGGED' }
            ].map(tab => (
              (!tab.condition && tab.condition !== undefined) ? null : 
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs font-bold tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-0.5 pb-1">
          {activeTab === 'posts' && posts.map((post) => (
            <PostGridItem key={post._id} post={post} />
          ))}
          {activeTab === 'saved' && savedPosts.map((post) => (
            <PostGridItem key={post._id} post={post} />
          ))}
          {
            ((activeTab === 'posts' && posts.length === 0) || 
             (activeTab === 'saved' && savedPosts.length === 0) ||
             (activeTab === 'tagged')) && (
               <div className="col-span-3 py-20 flex flex-col items-center justify-center text-gray-400">
                   <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-4">
                       <Grid className="w-8 h-8 text-gray-300" />
                   </div>
                   <p className="font-medium">{activeTab === 'tagged' ? 'No tagged posts yet' : 'No posts yet'}</p>
               </div>
           )}
        </div>
      </div>

       <FollowersListModal 
            isOpen={modalConfig.isOpen}
            onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            userId={targetUserId}
            type={modalConfig.type}
            title={modalConfig.title}
       />

      <BottomNav active="profile" />
    </div>
  );
};

const PostGridItem = React.memo(({ post }) => {
  return (
    <div className="relative aspect-square cursor-pointer group overflow-hidden bg-gray-100">
      {post.media && post.media.length > 0 ? (
          <LazyImage src={post.media[0].url} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
      ) : (
          <div className="w-full h-full flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-400" />
          </div>
      )}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-6 text-white font-bold">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 fill-white" />
            <span>{post.likesCount || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 fill-white" />
            <span>{post.commentsCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProfileScreen;