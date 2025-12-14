import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreHorizontal, Camera, X, Trash2, Send, Plus } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const StoriesScreen = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Create Mode State
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // View Mode State
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (userId === 'create') {
      setLoading(false);
    } else {
      fetchStories();
    }
    return () => clearInterval(timerRef.current);
  }, [userId]);

  const fetchStories = async () => {
    try {
      const res = await axios.get(`/stories/user/${userId}`);
      const storiesData = res.data.data || [];
      
      if (storiesData.length === 0) {
        if (userId === user._id) {
            navigate('/stories/create'); // redirect to create if no stories
        } else {
            toast.error("No stories available");
            navigate('/');
        }
        return;
      }
      setStories(storiesData);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load stories");
      navigate('/');
    }
  };

  // Timer for stories
  useEffect(() => {
    if (userId === 'create' || stories.length === 0) return;

    setProgress(0);
    const duration = 5000; // 5 seconds per story
    const interval = 50;
    
    // Mark as viewed
    const currentStory = stories[currentIndex];
    if (currentStory && !currentStory.viewers.includes(user._id)) {
        axios.post(`/stories/${currentStory._id}/view`).catch(console.error);
    }

    timerRef.current = setInterval(() => {
      setProgress(old => {
        if (old >= 100) {
          handleNext();
          return 0;
        }
        return old + (interval / duration) * 100;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, stories]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      navigate('/'); // End of stories
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
        navigate('/'); // simplified
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file); // Multer expects 'file'
      
      const uploadRes = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Handle potential new response format for upload as well
      const imageUrl = uploadRes.data.url || uploadRes.data.data?.url;
      
      await axios.post('/stories/create', {
        mediaUrl: imageUrl, 
        mediaType: file.type.startsWith('video') ? 'video' : 'image'
      });
      
      toast.success("Story added!");
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload story");
    } finally {
      setUploading(false);
    }
  };

  if (userId === 'create') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
         <button onClick={() => navigate('/')} className="absolute top-4 right-4">
            <X className="w-8 h-8" />
         </button>
         
         {preview ? (
             <div className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                 {file?.type.startsWith('video') ? (
                     <video src={preview} className="w-full h-full object-cover" autoPlay loop/>
                 ) : (
                     <img src={preview} className="w-full h-full object-cover" />
                 )}
                 
                 <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                     <button onClick={() => { setFile(null); setPreview(null); }} className="p-3 bg-red-600 rounded-full">
                         <Trash2 className="w-6 h-6" />
                     </button>
                     <button onClick={handleUpload} disabled={uploading} className="bg-blue-600 px-8 py-3 rounded-full font-bold">
                         {uploading ? 'Posting...' : 'Share to Story'}
                     </button>
                 </div>
             </div>
         ) : (
             <div className="text-center">
                 <label className="cursor-pointer flex flex-col items-center p-10 border-2 border-dashed border-gray-600 rounded-xl hover:border-gray-400 transition-colors">
                     <Camera className="w-16 h-16 mb-4" />
                     <span className="text-xl font-bold">Upload Photo/Video</span>
                     <input type="file" onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
                 </label>
             </div>
         )}
      </div>
    );
  }

  // View Mode
  if (loading) return <div className="bg-black min-h-screen flex items-center justify-center text-white">Loading stories...</div>;

  const story = stories[currentIndex];
  if (!story) return null;

  return (
    <div className="min-h-screen bg-black text-white relative">
        {/* Progress Bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
            {stories.map((s, i) => (
                <div key={s._id} className="h-1 bg-gray-600 flex-1 rounded overflow-hidden">
                    <div 
                        className="h-full bg-white transition-all duration-100 ease-linear"
                        style={{ 
                            width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' 
                        }}
                    ></div>
                </div>
            ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-3">
                 <button onClick={() => navigate('/')}><ArrowLeft className="w-6 h-6"/></button>
                 {story.userId.avatarUrl ? (
                     <img src={story.userId.avatarUrl} className="w-8 h-8 rounded-full border border-white object-cover"/>
                 ) : (
                     <div className="w-8 h-8 bg-gray-500 rounded-full"></div>
                 )}
                 <span className="font-bold text-sm">{story.userId.username}</span>
                 <span className="text-xs text-gray-300">{new Date(story.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <button><MoreHorizontal className="w-6 h-6"/></button>
        </div>

        {/* Story Media */}
        <div className="h-screen w-full flex items-center justify-center relative">
             {story.mediaType === 'video' ? (
                 <video src={story.mediaUrl} className="w-full h-full object-contain" autoPlay muted playsInline />
             ) : (
                 <img src={story.mediaUrl} className="w-full h-full object-contain" />
             )}
             
             {/* Tap Zones */}
             <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev}></div>
             <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext}></div>
        </div>

        {/* Reply Input (Optional) */}
        {user._id !== story.userId._id && (
             <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-2">
                 <input 
                    type="text" 
                    placeholder="Send message..." 
                    className="flex-1 bg-black/50 border border-gray-500 rounded-full px-4 py-2 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                 />
                 <button className="p-2 text-white"><Send className="w-6 h-6"/></button>
             </div>
        )}
        
        {/* Viewers Count (For Owner) */}
        {user._id === story.userId._id && (
             <div className="absolute bottom-8 left-4 z-20 flex items-center gap-2">
                 <div className="bg-black/50 px-3 py-1 rounded-full flex items-center gap-2">
                     <span className="text-sm font-bold">{story.viewers?.length || 0} viewers</span>
                 </div>
             </div>
        )}
    </div>
  );
};

export default StoriesScreen;