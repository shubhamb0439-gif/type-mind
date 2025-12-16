import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export const Auth: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithAzure } = useAuth();

  const handleAzureSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithAzure();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Microsoft');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex items-center justify-center mb-6 animate-[bounceIn_0.6s_ease-out]">
          <img src="/type mind.png" alt="TypeMindAI" className="w-32 h-auto" />
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 animate-[slideIn_0.4s_ease-out_0.2s_backwards]" style={{ color: '#531b93' }}>TypeMindAI</h1>
        <p className="text-center text-gray-600 mb-8 animate-[slideIn_0.4s_ease-out_0.3s_backwards]">
          Sign in with your organization account
        </p>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-[slideIn_0.3s_ease-out]">
              {error}
            </div>
          )}

          <button
            onClick={handleAzureSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:border-gray-400 hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-3 animate-[slideIn_0.3s_ease-out_0.3s_backwards]"
          >
            <LogIn className="h-5 w-5" />
            <span>{loading ? 'Signing in...' : 'Sign in with Microsoft'}</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Contact your administrator for access
          </p>
        </div>
      </div>
    </div>
  );
};
