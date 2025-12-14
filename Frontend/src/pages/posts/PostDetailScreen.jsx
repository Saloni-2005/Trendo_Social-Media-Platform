import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal, Image, Heart, MessageCircle, Share2, Bookmark, Send, Smile } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PostDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentsEndRef = useRef(null);
  
  const emojis = ['😊', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯'];

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/posts/${id}`);
      // Check if saved
      // Since getPostById doesn't return 'saved' status by context of user, we need to check user's savedPosts or fetch separately.
      // Easiest is to fetch user's saved posts list and check.
      // OR update getPostById to include 'saved' boolean
      // Let's check user's saved posts for now since we don't want to change getPostById again right now if avoided.
      // But actually, we have `user` from context. We can check `user.savedPosts` if we had it in context... we don't.
      // We can fetch `/posts/saved/${user._id}` and check.
      // Simpler: assume we extend getPostById return in future or just add a quick check.
      // Let's add a separate check for now.
      // Actually, let's update local post state.
      
      const savedRes = await axios.get(`/posts/saved/${user._id}`);
      const isSaved = savedRes.data.some(p => p._id === id);

      setPost({ ...res.data, saved: isSaved });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load post");
      navigate('/'); 
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      // Optimistic update
      const isLiked = post.likes.includes(user._id);
      setPost(prev => ({
        ...prev,
        likes: isLiked ? prev.likes.filter(id => id !== user._id) : [...prev.likes, user._id],
        likesCount: isLiked ? prev.likesCount - 1 : prev.likesCount + 1
      }));

      const endpoint = isLiked ? `/posts/${id}/unlike` : `/posts/${id}/like`;
      await axios.post(endpoint);
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
      // Revert if needed, but keeping simple
    }
  };
  
  const handleSave = async () => {
      try {
          const endpoint = post.saved ? `/posts/${id}/unsave` : `/posts/${id}/save`;
          await axios.post(endpoint);
          setPost(prev => ({ ...prev, saved: !prev.saved }));
          toast.success(post.saved ? "Removed from saved" : "Saved to collection");
      } catch (error) {
          console.error(error);
          toast.error("Failed to update save");
      }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await axios.post(`/posts/${id}/comment`, { text: newComment });
      
      // Update local state: append new comment
      setPost(prev => ({
          ...prev,
          comments: res.data.comments,
          commentsCount: res.data.commentsCount
      })); 
      setNewComment('');
      setShowEmojiPicker(false);
      toast.success("Comment added");
    } catch (error) {
        console.error(error);
        toast.error("Failed to post comment");
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
  if (!post) return <div className="min-h-screen flex justify-center items-center">Post not found</div>;

  const isLiked = post.likes?.includes(user?._id);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg mr-3 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Post</h2>
          </div>
        </div>

        {/* Post Content */}
        <div className="border-b border-gray-200">
          {/* Post Header */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.author._id}`)}>
               {post.author?.avatarUrl ? (
                   <img src={post.author.avatarUrl} className="w-10 h-10 rounded-full object-cover"/>
               ) : (
                   <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                       {post.author?.username?.[0]?.toUpperCase()}
                   </div>
               )}
              <div>
                <p className="font-medium text-gray-900">{post.author?.username}</p>
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Post Media */}
          {post.media && post.media.length > 0 ? (
             <img src={post.media[0].url} className="w-full h-auto object-cover max-h-[600px]"/>
          ) : (
             <div className="bg-gray-100 aspect-square flex items-center justify-center">
                <p className="text-gray-400">No Image</p>
             </div>
          )}

          {/* Post Actions */}
          <div className="p-4">
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-all ${
                  isLiked ? 'text-red-500 scale-110' : 'hover:text-red-500'
                }`}
              >
                <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{post.likesCount}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-7 h-7" />
                <span className="text-sm font-medium">{post.commentsCount}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                <Share2 className="w-7 h-7" />
              </button>
              <button 
                onClick={handleSave}
                className={`ml-auto transition-colors ${
                  post.saved ? 'text-blue-600' : 'hover:text-blue-500'
                }`}
              >
                <Bookmark className={`w-7 h-7 ${post.saved ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Post Caption */}
            <div className="mb-2">
              <p className="text-gray-900">
                <span className="font-medium mr-2">{post.author?.username}</span>
                {post.text}
              </p>
              {post.hashtags && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.hashtags.map((tag, i) => (
                      <span key={i} className="text-blue-600 hover:underline cursor-pointer">
                        #{tag}
                      </span>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center justify-between">
            Comments
            <span className="text-sm text-gray-500 font-normal">{post.comments?.length || 0} comments</span>
          </h3>

          <div className="space-y-4 mb-20">
            {post.comments?.map((comment) => (
              <div key={comment._id} className="flex gap-3 group">
                 {/* Comment Author Avatar - assuming populated or simplified */}
                 {/* Usually comments in schema might be array of objects. 
                     If backend populates `comments.user`, we use it. 
                     Step 115 `posts.controller.js` `getPostById` populates `comments.user`.
                  */}
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
                    {comment.user?.avatarUrl ? (
                         <img src={comment.user.avatarUrl} className="w-full h-full object-cover"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {comment.user?.username?.[0]}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 inline-block max-w-full">
                    <p className="text-sm">
                      <span className="font-medium text-gray-900 mr-2">{comment.user?.username}</span>
                      <span className="text-gray-700">{comment.text}</span>
                    </p>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>{new Date(comment.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* Comment Input - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="max-w-2xl mx-auto p-4">
          <form onSubmit={handleAddComment} className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform"
              >
                <Smile className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className={`px-6 py-2 font-medium rounded-full transition-all ${
                newComment.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Post
            </button>
          </form>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-3">
                {emojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setNewComment(newComment + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailScreen;