import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdminSignUp, setIsAdminSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp || isAdminSignUp) {
        const role = isAdminSignUp ? 'admin' : 'student';
        await signUp(email, password, fullName, role);
        setError('');
        if (isAdminSignUp) {
          alert('Admin account created successfully! You can now sign in.');
          setIsAdminSignUp(false);
          setIsSignUp(false);
        } else {
          alert('Account created! Please wait for admin approval.');
        }
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
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
          {isAdminSignUp ? 'Create admin account' : isSignUp ? 'Create your account' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(isSignUp || isAdminSignUp) && (
            <>
              <div className="animate-[slideIn_0.3s_ease-out]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors duration-200" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300 focus:scale-[1.02]"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="animate-[slideIn_0.3s_ease-out_0.1s_backwards]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors duration-200" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300 focus:scale-[1.02]"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="animate-[slideIn_0.3s_ease-out_0.2s_backwards]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors duration-200" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300 focus:scale-[1.02]"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] animate-[slideIn_0.3s_ease-out_0.3s_backwards]"
            style={{ backgroundColor: loading ? '#9ca3af' : '#531B93' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#42166f')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#531B93')}
          >
            {loading ? 'Please wait...' : isAdminSignUp ? 'Create Admin Account' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setIsAdminSignUp(false);
                setError('');
              }}
              className="text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ color: '#531B93' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#42166f'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#531B93'}
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
