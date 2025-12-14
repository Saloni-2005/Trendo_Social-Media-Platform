import React from 'react';
import { Phone, Video, X } from 'lucide-react';
import { useCall } from '../../context/CallContext';

const CallModal = () => {
  const { isReceivingCall, callAccepted, answerCall, call, leaveCall } = useCall();

  if (!isReceivingCall || callAccepted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
             {call.name?.[0]?.toUpperCase()}
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">{call.name}</h3>
            <p className="text-gray-500 text-sm">Incoming {call.isVideo ? 'Video' : 'Voice'} Call...</p>
          </div>

          <div className="flex gap-4 mt-4 w-full justify-center">
            <button 
              onClick={leaveCall}
              className="p-4 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <button 
              onClick={answerCall}
              className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg animate-pulse"
            >
              {call.isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
