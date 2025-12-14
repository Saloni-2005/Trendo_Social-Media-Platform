import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { useCall } from '../../context/CallContext';

const VideoCallScreen = () => {
  const { 
    callAccepted, 
    myVideo, 
    userVideo, 
    callEnded, 
    leaveCall, 
    isCallActive,
    stream,
    call,
    isVideo,
    remoteStream
  } = useCall();

  const [micOn, setMicOn] = React.useState(true);
  const [camOn, setCamOn] = React.useState(true);
  const [timer, setTimer] = useState(0);
  const [ringingTimer, setRingingTimer] = useState(0);

  // Attach Remote Stream
  React.useEffect(() => {
    if (callAccepted && !callEnded && userVideo.current && remoteStream) {
        userVideo.current.srcObject = remoteStream;
    }
  }, [callAccepted, callEnded, remoteStream]);

  // Attach Local Stream (Fix for empty video on toggle/render)
  React.useEffect(() => {
    if (stream && myVideo.current) {
        myVideo.current.srcObject = stream;
    }
  }, [stream, camOn]); // Re-attach when camOn (re-mounts video) or stream changes

  // Call Duration Timer (Starts after acceptance)
  React.useEffect(() => {
      let interval;
      if (callAccepted && !callEnded) {
          interval = setInterval(() => {
              setTimer(prev => prev + 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [callAccepted, callEnded]);

  // Ringing Timer (Starts before acceptance)
  React.useEffect(() => {
      let interval;
      if (isCallActive && !callAccepted && !callEnded) {
          interval = setInterval(() => {
              setRingingTimer(prev => prev + 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isCallActive, callAccepted, callEnded]);

  const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isCallActive) return null;

  const toggleMic = () => {
      if (stream) {
          stream.getAudioTracks()[0].enabled = !micOn;
          setMicOn(!micOn);
      }
  };

  const toggleCam = () => {
      if (stream) {
          stream.getVideoTracks()[0].enabled = !camOn;
          setCamOn(!camOn);
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        
        {/* Remote Video (Full Screen) */}
        {callAccepted && !callEnded ? (
           <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
        ) : (
           <div className="text-white text-xl animate-pulse">Connecting...</div>
        )}

        {/* Local Video (Floating) */}
        {stream && (
            <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10">
                {camOn ? (
                    <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xs text-center p-2">
                        <VideoOff className="w-8 h-8 mb-1 opacity-50" />
                    </div>
                )}
            </div>
        )}
        
        {/* Caller Info (Overlay) */}
        <div className="absolute top-8 left-8 text-white drop-shadow-md">
            <h2 className="text-2xl font-bold">{call.name || call.otherUserName || 'User'}</h2>
            <p className="opacity-80">
                {callAccepted 
                    ? formatTime(timer) 
                    : `Calling... ${formatTime(ringingTimer)}`
                }
            </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900/90 backdrop-blur-sm p-6 flex justify-center gap-6 pb-10">
        <button 
            onClick={toggleMic}
            className={`p-4 rounded-full transition-all ${micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white'}`}
        >
            {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button 
            onClick={leaveCall}
            className="p-5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all scale-105 hover:scale-110 shadow-lg"
        >
            <PhoneOff className="w-8 h-8" />
        </button>

        {isVideo && (
            <button 
                onClick={toggleCam}
                className={`p-4 rounded-full transition-all ${camOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white'}`}
            >
                {camOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
        )}
      </div>
    </div>
  );
};

export default VideoCallScreen;
