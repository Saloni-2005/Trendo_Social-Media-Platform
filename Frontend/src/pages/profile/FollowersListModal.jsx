import React, { useEffect, useState } from 'react';
import { X, UserPlus, UserCheck } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LazyImage from '../../components/common/LazyImage';
import { useAuth } from '../../context/AuthContext';

const FollowersListModal = ({ isOpen, onClose, userId, type, title }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (isOpen && userId && type) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/users/${userId}/connections/${type}`);
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToProfile = (id) => {
      navigate(`/profile/${id}`);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : users.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                    No users found.
                </div>
            ) : (
                <div className="space-y-1">
                    {users.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" onClick={() => navigateToProfile(u._id)}>
                            <div className="flex items-center gap-3">
                                {u.avatarUrl ? (
                                    <LazyImage src={u.avatarUrl} alt={u.username} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                ) : (
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {u.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{u.username}</p>
                                    <p className="text-xs text-gray-500">{u.displayName}</p>
                                </div>
                            </div>
                            {/* Follow Button (Placeholder logic for now) */}
                            {currentUser?._id !== u._id && (
                                <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors">
                                    View
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FollowersListModal;
