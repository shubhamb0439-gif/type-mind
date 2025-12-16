import React from 'react';
import { X, Trophy, Target, Clock, TrendingUp, Award, Zap, Activity, BookOpen } from 'lucide-react';

interface UserRanking {
  user_id: string;
  total_points: number;
  rank_grade: string;
  rank_category: string;
  total_time_hours: number;
  average_accuracy: number;
  average_wpm: number;
  overall_position: number;
  category_position: number;
  theme: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  level?: string;
  status: string;
}

interface StudentAnalyticsProps {
  user: Profile;
  ranking?: UserRanking;
  onClose: () => void;
}

export const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ user, ranking, onClose }) => {
  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'S-Rank': 'from-yellow-400 to-amber-500',
      'A-Rank': 'from-emerald-400 to-green-500',
      'B-Rank': 'from-blue-400 to-cyan-500',
      'C-Rank': 'from-orange-400 to-amber-500',
      'D-Rank': 'from-slate-400 to-gray-500',
    };
    return colors[rank] || colors['D-Rank'];
  };

  if (!ranking) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Student Analytics</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No ranking data available for {user.full_name}</p>
            <p className="text-sm text-slate-400 mt-2">User hasn't completed any lessons yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full p-8 my-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-xl">
                <Target className="w-7 h-7 text-white" />
              </div>
              Student Performance Analytics
            </h2>
            <p className="text-slate-600 mt-2 ml-14">{user.full_name} • {user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`bg-gradient-to-br ${getRankColor(ranking.rank_grade)} rounded-2xl p-6 text-white shadow-xl`}>
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-8 h-8" />
              <div className="text-sm font-medium opacity-90">Current Rank</div>
            </div>
            <div className="text-5xl font-bold mb-2">{ranking.rank_grade}</div>
            <div className="text-sm opacity-90">Position #{ranking.overall_position}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-8 h-8" />
              <div className="text-sm font-medium opacity-90">Total Points</div>
            </div>
            <div className="text-5xl font-bold mb-2">{ranking.total_points}</div>
            <div className="text-sm opacity-90">Category: {ranking.rank_category}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-8 h-8" />
              <div className="text-sm font-medium opacity-90">Practice Time</div>
            </div>
            <div className="text-5xl font-bold mb-2">{ranking.total_time_hours.toFixed(1)}</div>
            <div className="text-sm opacity-90">Hours</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-blue-500" />
              <div className="text-right">
                <div className="text-sm text-slate-600 font-medium">Words Per Minute</div>
                <div className="text-4xl font-bold text-slate-900 mt-1">
                  {Math.round(ranking.average_wpm)}
                </div>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                style={{ width: `${Math.min((ranking.average_wpm / 100) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-500 mt-2">Target: 100 WPM</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-emerald-500" />
              <div className="text-right">
                <div className="text-sm text-slate-600 font-medium">Accuracy</div>
                <div className="text-4xl font-bold text-slate-900 mt-1">
                  {Math.round(ranking.average_accuracy)}%
                </div>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                style={{ width: `${ranking.average_accuracy}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-500 mt-2">Target: 100%</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-purple-500" />
              <div className="text-right">
                <div className="text-sm text-slate-600 font-medium">Performance Score</div>
                <div className="text-4xl font-bold text-slate-900 mt-1">
                  {Math.round((ranking.average_wpm * ranking.average_accuracy) / 100)}
                </div>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                style={{ width: `${Math.min(((ranking.average_wpm * ranking.average_accuracy) / 10000) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-500 mt-2">WPM × Accuracy</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
            <BookOpen className="w-6 h-6 text-blue-600 mb-2" />
            <div className="text-sm text-slate-600 font-medium mb-1">Assessment Level</div>
            <div className="text-2xl font-bold text-slate-900 capitalize">{user.level || 'N/A'}</div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
            <TrendingUp className="w-6 h-6 text-emerald-600 mb-2" />
            <div className="text-sm text-slate-600 font-medium mb-1">Category Rank</div>
            <div className="text-2xl font-bold text-slate-900">#{ranking.category_position}</div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
            <Trophy className="w-6 h-6 text-amber-600 mb-2" />
            <div className="text-sm text-slate-600 font-medium mb-1">Theme Status</div>
            <div className="text-2xl font-bold text-slate-900 capitalize">{ranking.theme}</div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
            <Award className="w-6 h-6 text-purple-600 mb-2" />
            <div className="text-sm text-slate-600 font-medium mb-1">Category</div>
            <div className="text-2xl font-bold text-slate-900">{ranking.rank_category}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold mb-1">
                {ranking.total_points > 0 ? Math.round(ranking.total_points / Math.max(ranking.total_time_hours, 0.1)) : 0}
              </div>
              <div className="text-sm opacity-90">Points per Hour</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold mb-1">
                {((ranking.average_wpm + ranking.average_accuracy) / 2).toFixed(1)}
              </div>
              <div className="text-sm opacity-90">Overall Performance</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold mb-1">
                {ranking.rank_grade === 'S-Rank' ? 'MAX' : `${Math.max(0, (ranking.overall_position - 1))} Ahead`}
              </div>
              <div className="text-sm opacity-90">Users to Beat</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
