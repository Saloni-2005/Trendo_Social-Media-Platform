import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Heart, MessageCircle, Share2, Bookmark, Image } from 'lucide-react';
import LazyImage from '../common/LazyImage';

const PostItem = memo(({ post, onLike, onSave }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.authorId?._id}`} className="relative group">
            {post.authorId?.avatarUrl ? (
               <LazyImage 
                 src={post.authorId.avatarUrl} 
                 alt={post.authorId.username} 
                 className="w-10 h-10 rounded-full border border-gray-100"
               />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                 {post.authorId?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <Link to={`/profile/${post.authorId?._id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {post.authorId?.username || 'Unknown User'}
            </Link>
            <p className="text-xs text-gray-500 font-medium">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Post Image */}
      {post.media && post.media.length > 0 && (
          <div className="bg-gray-50 flex items-center justify-center relative group">
             {post.media[0].url ? (
                 <LazyImage 
                    src={post.media[0].url} 
                    alt="Post content" 
                    className="w-full h-auto max-h-[500px]"
                 />
             ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                   <Image className="w-16 h-16" />
                </div>
             )}
             {/* Overlay Like Animation (could implement later) */}
          </div>
      )}

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button 
            onClick={() => onLike(post)}
            className={`flex items-center gap-2 transition-transform active:scale-90 group ${
              post.liked ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
            }`}
          >
            <Heart 
              className={`w-6 h-6 transition-all duration-300 ${post.liked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} 
            />
            <span className="text-sm font-medium">{post.likesCount}</span>
          </button>
          
          <Link to={`/post/${post._id}`} className="flex items-center gap-2 text-gray-700 hover:text-blue-500 transition-colors group">
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">{post.commentsCount}</span>
          </Link>
          
          <button className="flex items-center gap-2 text-gray-700 hover:text-green-500 transition-colors group">
            <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          
          <button 
            onClick={() => onSave(post)}
            className={`ml-auto transition-transform active:scale-90 ${
              post.saved ? 'text-blue-600' : 'text-gray-700 hover:text-blue-500'
            }`}
          >
            <Bookmark className={`w-6 h-6 transition-all duration-300 ${post.saved ? 'fill-current scale-110' : ''}`} />
          </button>
        </div>

        {/* Post Caption */}
        <div className="text-gray-900 mb-2 leading-relaxed">
          <span className="font-semibold mr-2">{post.authorId?.username}</span> 
          {post.text}
          <div className="mt-1 flex flex-wrap gap-1">
              {post.hashtags?.map(tag => (
                  <span key={tag} className="text-blue-600 text-sm hover:underline cursor-pointer">#{tag}</span>
              ))}
          </div>
        </div>
        <Link to={`/post/${post._id}`} className="text-gray-500 text-sm hover:text-gray-900 transition-colors font-medium">
          View all {post.commentsCount} comments
        </Link>
      </div>
    </div>
  );
});

export default PostItem;
