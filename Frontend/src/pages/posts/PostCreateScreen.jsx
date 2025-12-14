import React, { useState, useRef } from 'react';
import { Camera, Image, Video, Smile, Hash, X, MapPin, Users } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PostCreateScreen = () => {
  const [caption, setCaption] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // Store actual File objects
  const [previewImages, setPreviewImages] = useState([]); // Store URLs for preview
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState('');
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef(null);
  const maxChars = 500;
  const navigate = useNavigate();
  const { user } = useAuth();

  const emojis = ['😊', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯', '🌟', '👏', '🙌', '💪', '😍', '🤩', '😎'];

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);
    
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setPreviewImages([...previewImages, ...imageUrls]);
  };

  const removeImage = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previewImages];
    URL.revokeObjectURL(newPreviews[index]); // Cleanup
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  const addEmoji = (emoji) => {
    setCaption(caption + emoji);
    setShowEmojiPicker(false);
  };

  const handleHashtagClick = () => {
    if (!caption.endsWith('#')) {
      setCaption(caption + ' #');
    }
  };

  const extractHashtags = (text) => {
    const matches = text.match(/#\w+/g);
    return matches ? matches.map(tag => tag.slice(1)) : []; // Remove #
  };

  const handlePost = async () => {
    if (!caption.trim() && selectedFiles.length === 0) {
      toast.error('Please add a caption or image');
      return;
    }

    setIsPosting(true);
    const toastId = toast.loading('Creating post...');

    try {
      // 1. Upload Files
      const uploadedMedia = [];
      
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
           const uploadRes = await axios.post('/upload', formData, {
             headers: { 'Content-Type': 'multipart/form-data' }
           });
           uploadedMedia.push({
             url: uploadRes.data.url,
             type: uploadRes.data.type,
             // You can add width/height/duration if backend supports metdata extraction
           });
        } catch (uploadError) {
           console.error("Upload failed for file", file.name, uploadError);
           toast.error(`Failed to upload ${file.name}`);
        }
      }

      // 2. Create Post
      const hashtags = extractHashtags(caption);
      
      const postData = {
        text: caption,
        media: uploadedMedia,
        hashtags: hashtags,
        visibility: "public"
      };

      await axios.post('/posts/create', postData);
      
      toast.success('Post created successfully!', { id: toastId });
      navigate('/'); // Redirect to home
      
    } catch (error) {
      console.error("Create post error", error);
      toast.error('Failed to create post', { id: toastId });
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancel = () => {
    if (caption || selectedFiles.length > 0) {
      if (window.confirm('Discard this post?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
            <button
              onClick={handlePost}
              disabled={isPosting || (!caption.trim() && selectedFiles.length === 0)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isPosting || (!caption.trim() && selectedFiles.length === 0)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* User Info */}
          <div className="flex gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold">
               {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{user?.username || 'user'}</p>
              <p className="text-sm text-gray-500">Public post</p>
            </div>
          </div>

          {/* Caption Input */}
          <div className="mb-4">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, maxChars))}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
              rows="6"
            />
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Add emoji
              </button>
              <span className={`text-sm ${caption.length >= maxChars ? 'text-red-500' : 'text-gray-500'}`}>
                {caption.length}/{maxChars}
              </span>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {emojis.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => addEmoji(emoji)}
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Images Preview */}
          {previewImages.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-2">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image}
                      alt={`Selected ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-gray-900 bg-opacity-70 rounded-full hover:bg-opacity-90 transition-all"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
          >
            <div className="text-center">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-1 font-medium">Click to upload media</p>
              <p className="text-sm text-gray-500">Images and Videos supported</p>
              <p className="text-xs text-gray-400 mt-2">Max 10 files, up to 50MB each</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Additional Options */}
          <div className="space-y-3 mb-4">
            {/* Location */}
            <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
              <MapPin className="w-5 h-5 text-gray-600" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="flex-1 outline-none text-gray-900"
              />
            </div>

            {/* Tag People */}
            <button
              onClick={() => console.log('Open tag people modal')}
              className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
            >
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Tag people</span>
              {taggedUsers.length > 0 && (
                <span className="ml-auto text-sm text-blue-600 font-medium">
                  {taggedUsers.length} tagged
                </span>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add photos"
              >
                <Camera className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add video"
              >
                <Video className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add emoji"
              >
                <Smile className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleHashtagClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add hashtag"
              >
                <Hash className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <span className="text-sm text-gray-500">Add to post</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreateScreen;