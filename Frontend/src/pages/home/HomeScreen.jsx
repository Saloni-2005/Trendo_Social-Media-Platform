import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Plus, User } from 'lucide-react';
import BottomNav from '../../components/common/BottomNav';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PostItem from '../../components/posts/PostItem';
import LazyImage from '../../components/common/LazyImage';

const HomeScreen = () => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await axios.get('/stories/feed');
      // Backend now returns { status: 'success', data: [...] }
      setStories(res.data.data || []);
    } catch (error) {
      console.error("Error fetching stories", error);
      setStories([]);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get('/posts/feed/home');
      // Handle both old array format and new object format just in case
      const postsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      // enhance posts with local 'liked' state
      const enhancedPosts = postsData.map(post => ({
        ...post,
        liked: post.likes?.includes(user?._id) || false,
        saved: false
      }));
      setPosts(enhancedPosts);
    } catch (error) {
      console.error("Error fetching posts", error);
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = useCallback(async (post) => {
    try {
        const isLiked = post.likes?.includes(user?._id);
        const endpoint = isLiked ? `/posts/${post._id}/unlike` : `/posts/${post._id}/like`;
        await axios.post(endpoint);

        setPosts(currentPosts => currentPosts.map(p => 
            p._id === post._id 
              ? { 
                  ...p, 
                  liked: !isLiked, 
                  likes: isLiked ? p.likes.filter(id => id !== user._id) : [...(p.likes || []), user._id],
                  likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1 
                }
              : p
        ));
    } catch (error) {
        toast.error("Failed to update like");
    }
  }, [user]);

  const handleSave = useCallback(async (post) => {
    try {
        const endpoint = post.saved ? `/posts/${post._id}/unsave` : `/posts/${post._id}/save`;
        await axios.post(endpoint);

        setPosts(currentPosts => currentPosts.map(p => 
            p._id === post._id ? { ...p, saved: !p.saved } : p
        ));
    } catch (error) {
        toast.error("Failed to update save");
    }
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  // Determine if current user has a story
  const myStory = stories.find(s => s.user._id === user?._id);
  const otherStories = stories.filter(s => s.user._id !== user?._id);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TRENDO</h2>
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Stories Section - Optimized Styling */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            
            {/* My Story */}
            <div className="flex-shrink-0 text-center cursor-pointer group" onClick={() => myStory ? navigate(`/stories/${user._id}`) : navigate('/stories/create')}>
                <div className={`w-18 h-18 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-105 relative ${myStory ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[3px]' : ''}`}>
                    <div className="w-16 h-16 bg-white rounded-full p-[2px] overflow-hidden">
                         {user?.avatarUrl ? (
                             <LazyImage src={user.avatarUrl} className="rounded-full shadow-inner w-full h-full"/>
                         ) : (
                             <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                 <User className="w-6 h-6 text-gray-400"/>
                             </div>
                         )}
                    </div>
                    {!myStory && (
                        <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-white shadow-sm">
                            <Plus className="w-3 h-3 text-white stroke-[3px]" />
                        </div>
                    )}
                </div>
                <span className="text-xs font-medium text-gray-600 block truncate w-16">
                  Your Story
                </span>
            </div>

            {/* Other Stories */}
            {otherStories.map((storyGroup) => (
              <div key={storyGroup.user._id} className="flex-shrink-0 text-center cursor-pointer group" onClick={() => navigate(`/stories/${storyGroup.user._id}`)}>
                <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[3px] mb-2 transition-transform group-hover:scale-105">
                    <div className="w-16 h-16 bg-white rounded-full p-[2px] overflow-hidden">
                        {storyGroup.user.avatarUrl ? (
                            <LazyImage src={storyGroup.user.avatarUrl} className="rounded-full w-full h-full"/>
                        ) : (
                             <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                 <User className="w-6 h-6 text-gray-400"/>
                             </div>
                        )}
                    </div>
                </div>
                <span className="text-xs font-medium text-gray-600 block truncate w-16">
                  {storyGroup.user.username}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6 px-2 sm:px-0">
          {posts.map((post) => (
            <PostItem 
                key={post._id} 
                post={post} 
                onLike={handleLike} 
                onSave={handleSave} 
            />
          ))}
          
           {posts.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                  No posts yet. Be the first to post!
              </div>
          )}
        </div>

        {/* Load More */}
        {posts.length > 0 && (
            <div className="flex justify-center py-8">
            <button className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Load More Posts
            </button>
            </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
};

export default HomeScreen;