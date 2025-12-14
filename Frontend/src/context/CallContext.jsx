import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer'; // We will need to install this
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

import { useSocket } from './SocketContext';

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
    const { user } = useAuth(); // Token not needed here anymore, handled in SocketContext
    const socket = useSocket(); // Use shared socket
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState(null);
    const [name, setName] = useState('');
    const [call, setCall] = useState({});
    const [me, setMe] = useState('');
    const [isReceivingCall, setIsReceivingCall] = useState(false);
    const [isVideo, setIsVideo] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    
    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    // const socket = useRef(); // REMOVED: Using context socket

    useEffect(() => {
        if (!socket) return; // Wait for socket

        socket.on('me', (id) => setMe(id));

        socket.on('call_user', ({ from, name: callerName, signal, isVideo }) => {
            setCall({ isReceivedCall: true, from, name: callerName, signal, isVideo });
            setIsReceivingCall(true);
            setIsVideo(isVideo);
        });

        socket.on('call_ended', () => {
            leaveCall();
            toast('Call ended by user');
        });

        return () => {
             socket.off('me');
             socket.off('call_user');
             socket.off('call_ended');
        };
    }, [socket]);

    const [remoteStream, setRemoteStream] = useState(null);

    // ...

    const answerCall = () => {
        setCallAccepted(true);
        setIsCallActive(true);
        setIsReceivingCall(false);

        navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }

                const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });

                peer.on('signal', (data) => {
                    if (socket) {
                        socket.emit('answer_call', { signal: data, to: call.from });
                    }
                });

                peer.on('stream', (currentStream) => {
                    setRemoteStream(currentStream); // Store in state for UI re-render
                });

                peer.signal(call.signal);
                connectionRef.current = peer;
            });
    };

    const callUser = (id, conversationId, isVideoCall = false, otherUserName = '') => { // Added otherUserName
        if (!socket) {
            toast.error("Connection not ready. Please try again.");
            return;
        }

        setIsCallActive(true);
        setIsVideo(isVideoCall);
        // Store userToCall, conversationId, AND otherUserName
        setCall(prev => ({ ...prev, userToCall: id, conversationId, otherUserName })); 
        
        navigator.mediaDevices.getUserMedia({ video: isVideoCall, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }

                const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

                peer.on('signal', (data) => {
                   if (socket) {
                        socket.emit('call_user', { 
                            userToCall: id, 
                            signalData: data, 
                            from: user._id, 
                            name: user.username,
                            isVideo: isVideoCall,
                            conversationId // Optional: could send here if we wanted start msg
                        });
                   }
                });

                peer.on('stream', (currentStream) => {
                    setRemoteStream(currentStream); // Store in state
                });

                if (socket) {
                    socket.on('call_accepted', (signal) => {
                        setCallAccepted(true);
                        peer.signal(signal);
                    });
                }

                connectionRef.current = peer;
            })
            .catch(err => {
                console.error("Failed to get media", err);
                toast.error("Could not access camera/microphone");
                setIsCallActive(false);
            });
    };

    const leaveCall = () => {
        setCallEnded(true);
        setIsCallActive(false);
        setIsReceivingCall(false);
        setCallAccepted(false);
        
        const idToNotify = call.from || call.userToCall;
        const convId = call.conversationId;
        // Determine initiator: if we received call, initiator is 'from'. If we called, it's us (user._id).
        // call.from is only present if we received the call.
        const initiator = call.isReceivedCall ? call.from : user._id;

        if (socket && idToNotify) {
             socket.emit('end_call', { 
                 to: idToNotify,
                 conversationId: convId,
                 isVideo: isVideo, // Pass current video state
                 initiator // Pass who started it
             });
        }

        setCall({});
        setRemoteStream(null); // Clear remote stream

        if(stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        
        window.location.reload(); 
    };

    return (
        <CallContext.Provider value={{
            call,
            callAccepted,
            myVideo,
            userVideo,
            stream,
            name,
            setName,
            callEnded,
            me,
            callUser,
            leaveCall,
            answerCall,
            isReceivingCall,
            isVideo,
            isCallActive,
            remoteStream
        }}>
            {children}
        </CallContext.Provider>
    );
};
