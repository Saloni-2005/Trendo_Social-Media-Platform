import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { CallProvider } from './context/CallContext';
import CallModal from './components/calling/CallModal';
import VideoCallScreen from './components/calling/VideoCallScreen';

const LoginScreen = lazy(() => import('./pages/auth/LoginScreen'));
const SignupScreen = lazy(() => import('./pages/auth/SignupScreen'));
const HomeScreen = lazy(() => import('./pages/home/HomeScreen'));
const ProfileScreen = lazy(() => import('./pages/profile/ProfileScreen'));
const SearchScreen = lazy(() => import('./pages/search/SearchScreen'));
const PostCreateScreen = lazy(() => import('./pages/posts/PostCreateScreen'));
const PostDetailScreen = lazy(() => import('./pages/posts/PostDetailScreen'));
const ChatListScreen = lazy(() => import('./pages/chats/ChatListScreen'));
const ChatDetailScreen = lazy(() => import('./pages/chats/ChatDetailScreen'));
const NotificationsScreen = lazy(() => import('./pages/notifications/NotificationsScreen'));
const StoriesScreen = lazy(() => import('./pages/stories/StoriesScreen'));

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <Outlet />;
};

import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
              <Suspense fallback={
                <div className="flex items-center justify-center h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }>
                <Routes>
                  <Route path="/signup" element={<SignupScreen />} />
                  <Route path="/login" element={<LoginScreen />} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="/create" element={<PostCreateScreen />} />
                    <Route path="/chats" element={<ChatListScreen />} />
                    <Route path="/chat/:chatId" element={<ChatDetailScreen />} />
                    
                    {/* Profile Routes */}
                    <Route path="/profile" element={<ProfileScreen />} />
                    <Route path="/profile/:userId" element={<ProfileScreen />} />
                    
                    <Route path="/search" element={<SearchScreen />} />
                    <Route path="/notifications" element={<NotificationsScreen />} />
                    <Route path="/post/:id" element={<PostDetailScreen />} />
                    <Route path="/stories/create" element={<StoriesScreen />} />
                  </Route>
                  
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                
                {/* Call UI Overlays */}
                <CallModal />
                <VideoCallScreen />
                
              </Suspense>
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;