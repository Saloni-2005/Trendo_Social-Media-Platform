import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && token) {
        if (socketRef.current) {
             // If socket exists and connected, don't reconnect unless user changed
             if(socketRef.current.connected) {
                 return;
             }
        }

      const newSocket = io('http://localhost:7845', {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Global Socket Connected:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err);
      });

      setSocket(newSocket);
      socketRef.current = newSocket;

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
      };
    } else {
        if(socketRef.current) {
            socketRef.current.disconnect();
            setSocket(null);
            socketRef.current = null;
        }
    }
  }, [user, token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
