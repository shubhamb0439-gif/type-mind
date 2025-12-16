import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './pages/Auth';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentDashboard } from './pages/StudentDashboard';

function AppContent() {
  const { user, profile, hasAccess, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (user && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md p-8 text-center">
          <div className="mb-4">
            <img src="/type mind.png" alt="TypeMindAI" className="w-24 h-auto mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#531b93' }}>
            Access Not Granted
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have access to TypeMindAI. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Setting up your profile...</div>
      </div>
    );
  }

  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
