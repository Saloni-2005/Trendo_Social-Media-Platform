import { useSocket } from '../../context/SocketContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { toast } from 'react-hot-toast';
import LazyImage from '../../components/common/LazyImage';
import { ArrowLeft, MoreHorizontal, Plus, Smile, Send, Phone, Video, Image as ImageIcon } from 'lucide-react';
// ... other imports

const ChatDetailScreen = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { callUser } = useCall();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const socket = useSocket(); // Use shared socket
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    
    // Join conversation
    socket.emit('join_conversation', { conversationId: chatId });

    const handleNewMessage = (data) => {
        const msg = data.message || data; 
        if (msg.conversation === chatId || data.conversationId === chatId) {
           setMessages(prev => [...prev, msg]);
        }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_conversation', { conversationId: chatId });
      socket.off('new_message', handleNewMessage);
    };
  }, [chatId, socket]);

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/chat/conversations/${chatId}/messages`);
      setMessages(res.data.messages);
      
      // Determine other user
      if (res.data.conversation) {
        const other = res.data.conversation.participants.find(p => p._id !== user._id);
        setOtherUser(other);
      }
    } catch (error) {
      console.error("Error fetching messages", error);
      toast.error("Failed to load chat");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (newMessage.trim() && socket) {
      socket.emit('send_message', {
        conversationId: chatId,
        content: newMessage,
        messageType: 'text'
      });
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleVoiceCall = () => {
    if (otherUser?._id) {
        // Pass username for display
        callUser(otherUser._id, chatId, false, otherUser.username); 
    }
  };

  const handleVideoCall = () => {
     if (otherUser?._id) {
        // Pass username for display
        callUser(otherUser._id, chatId, true, otherUser.username);
     }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <button 
          onClick={() => navigate('/chats')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        
        <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${otherUser?._id}`)}>
          {otherUser?.avatarUrl ? (
            <LazyImage src={otherUser.avatarUrl} alt={otherUser.username} className="w-10 h-10 rounded-full object-cover border border-gray-200"/>
          ) : (
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {otherUser?.username?.[0]?.toUpperCase()}
             </div>
          )}
          {/* Active Status Indicator (Placeholder) */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white ring-1 ring-white"></div>
        </div>
        
        <div className="flex-1 cursor-pointer" onClick={() => navigate(`/profile/${otherUser?._id}`)}>
          <p className="font-bold text-gray-900 leading-tight">{otherUser?.username || 'User'}</p>
          <p className="text-xs text-green-600 font-medium">Online</p>
        </div>

        <div className="flex items-center gap-1">
            <button 
                onClick={handleVoiceCall}
                className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-blue-600"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button 
                onClick={handleVideoCall}
                className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-blue-600"
            >
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 bg-[url('https://res.cloudinary.com/djv4z3dbu/image/upload/v1716654719/chat-bg-pattern_guw05r.png')] bg-repeat bg-center">
        {messages.map((message, index) => {
          if (message.messageType === 'system') {
             const isMyCall = message.sender === user?._id || message.sender?._id === user?._id;
             const isVideo = message.content.includes('Video');
             
             return (
                 <div key={message._id || index} className="flex justify-center my-4">
                     <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                         <div className={`p-2 rounded-full ${isMyCall ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                             {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                         </div>
                         <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-800">
                                 {isMyCall ? 'Outgoing ' : 'Incoming '}{message.content}
                             </span>
                             <span className="text-xs text-gray-500">
                                 {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                         </div>
                     </div>
                 </div>
             );
          }

          const isMe = message.sender._id === user?._id || message.sender === user?._id; 
          
          return (
            <div
              key={message._id || index}
              className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'} group`}
            >
              {!isMe && (
                 <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 self-end mb-1">
                    {otherUser?.avatarUrl ? (
                        <LazyImage src={otherUser.avatarUrl} className="w-full h-full object-cover"/>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold">
                            {otherUser?.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                 </div>
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <div
                  className={`w-fit px-4 py-2.5 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words whitespace-pre-wrap ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'
                  }`}
                >
                  {message.content}
                </div>
                <span
                  className={`text-[10px] mt-1 px-1 font-medium ${
                    isMe ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto">
          <button type="button" className="p-3 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 text-blue-600">
            <Plus className="w-6 h-6" />
          </button>
          
          <div className="flex-1 relative bg-gray-100 rounded-3xl flex items-center px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-blue-200">
            <button type="button" className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                <Smile className="w-5 h-5"/>
            </button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message..."
              className="flex-1 bg-transparent px-2 py-2 outline-none resize-none overflow-hidden text-gray-900 placeholder-gray-500 max-h-32"
              rows="1"
            />
             {newMessage.trim() && (
                 <button
                    type="submit"
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md m-1"
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </button>
             )}
          </div>

          {!newMessage.trim() && (
             <>
                <button type="button" className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                   <ImageIcon className="w-6 h-6" />
                </button>
                 <button type="button" className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                   <Phone className="w-6 h-6" />
                </button>
             </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatDetailScreen;