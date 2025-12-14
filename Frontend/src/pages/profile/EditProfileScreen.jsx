import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Loader, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const EditProfileScreen = () => {
    const { user, login } = useAuth(); // login might be needed to update local user state if AuthContext supports it
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        username: '',
        email: '',
        avatarUrl: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                bio: user.bio || '',
                username: user.username || '',
                email: user.email || '',
                avatarUrl: user.avatarUrl || ''
            });
            setAvatarPreview(user.avatarUrl);
        } else {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const toastId = toast.loading("Updating profile...");

        try {
            let finalAvatarUrl = formData.avatarUrl;

            // 1. Upload new avatar if selected
            if (avatarFile) {
                const uploadData = new FormData();
                uploadData.append('file', avatarFile);

                try {
                    const uploadRes = await axios.post('/upload', uploadData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    finalAvatarUrl = uploadRes.data.url || uploadRes.data.data?.url;
                } catch (uploadError) {
                    console.error("Avatar upload failed", uploadError);
                    toast.error("Failed to upload image", { id: toastId });
                    setSaving(false);
                    return;
                }
            }

            // 2. Update User Profile
            const updatePayload = {
                displayName: formData.displayName,
                bio: formData.bio,
                avatarUrl: finalAvatarUrl
                // username/email updates might be restricted or require separate flow
            };

            const res = await axios.put(`/users/${user._id}`, updatePayload);
            
            // 3. Update local storage/context
            // Assuming the backend returns the updated user object
            const updatedUser = res.data;
            localStorage.setItem('user', JSON.stringify(updatedUser)); // standardized on 'user' key
            
            // Force reload or update context manually if login function isn't suitable for updates
            // A page reload is simple way to refresh Context
            window.location.href = '/profile'; 
            
            toast.success("Profile updated!", { id: toastId });
            // navigate('/profile'); // handled by location.reload or href
            
        } catch (error) {
            console.error("Update error", error);
            toast.error(error.response?.data?.message || "Failed to update profile", { id: toastId });
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
                    <button 
                        onClick={handleSubmit} 
                        disabled={saving}
                        className="text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4">
                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                                    {user?.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 text-blue-600 font-semibold text-sm hover:text-blue-700"
                    >
                        Change Profile Photo
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Form Fields */}
                <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Your Name"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows="3"
                            maxLength="150"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                            placeholder="Write something about yourself..."
                        />
                        <div className="text-right text-xs text-gray-400 mt-1">
                            {formData.bio.length}/150
                        </div>
                    </div>

                    {/* Read-Only Fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <div className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500">
                             @{formData.username}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                         <div className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500">
                             {formData.email}
                        </div>
                    </div>
                </div>
                
                <p className="text-center text-xs text-gray-400 mt-6">
                    Usernames and emails cannot be changed directly properly to ensure system integrity.
                </p>
            </div>
        </div>
    );
};

export default EditProfileScreen;
