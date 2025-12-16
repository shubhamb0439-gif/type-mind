import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile, Class } from '../lib/supabase';
import {
  LogOut, Users, BookOpen, CheckCircle, XCircle, Plus, Trophy, Clock, Target,
  TrendingUp, Medal, Trash2, Activity, Award, Zap, BarChart3, PieChart,
  Brain, Sparkles, UserCheck, UserX, Timer, Shield
} from 'lucide-react';
import { CreateClassModal } from '../components/CreateClassModal';
import { StudentAnalytics } from '../components/StudentAnalytics';

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

interface UserWithRanking extends Profile {
  ranking?: UserRanking;
}

interface DashboardStats {
  totalStudents: number;
  approvedStudents: number;
  pendingStudents: number;
  totalLessons: number;
  totalCompletions: number;
  totalPointsAwarded: number;
  avgWpm: number;
  avgAccuracy: number;
}

export const AdminDashboard: React.FC = () => {
  const { signOut, profile } = useAuth();
  const [users, setUsers] = useState<UserWithRanking[]>([]);
  const [lessons, setLessons] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'lessons' | 'admins' | 'leaderboard'>('dashboard');
  const [selectedUser, setSelectedUser] = useState<UserWithRanking | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    approvedStudents: 0,
    pendingStudents: 0,
    totalLessons: 0,
    totalCompletions: 0,
    totalPointsAwarded: 0,
    avgWpm: 0,
    avgAccuracy: 0
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, rankingsData, lessonsData, statsData] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
        supabase.from('user_rankings').select('*'),
        supabase.from('classes').select('*').order('created_at', { ascending: false }),
        fetchStats()
      ]);

      if (usersData.data && rankingsData.data) {
        const usersWithRankings = usersData.data.map(user => ({
          ...user,
          ranking: rankingsData.data.find((r: UserRanking) => r.user_id === user.id)
        }));
        setUsers(usersWithRankings);
      }

      if (lessonsData.data) setLessons(lessonsData.data);
      if (statsData) setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (): Promise<DashboardStats> => {
    try {
      // Fetch all students
      const { data: allStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('status')
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      // Calculate student stats
      const totalStudents = allStudents?.length || 0;
      const approvedStudents = allStudents?.filter(s => s.status === 'approved').length || 0;
      const pendingStudents = allStudents?.filter(s => s.status === 'pending').length || 0;

      // Fetch lesson count
      const { count: lessonCount, error: lessonsError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      if (lessonsError) throw lessonsError;

      // Fetch lesson completions with stats
      const { data: completions, error: completionsError } = await supabase
        .from('lesson_completions')
        .select('score, wpm, accuracy');

      if (completionsError) throw completionsError;

      // Calculate completion stats
      const totalCompletions = completions?.length || 0;
      const totalPointsAwarded = completions?.reduce((sum, c) => sum + (c.score || 0), 0) || 0;
      const avgWpm = completions?.length
        ? Math.round(completions.reduce((sum, c) => sum + (c.wpm || 0), 0) / completions.length)
        : 0;
      const avgAccuracy = completions?.length
        ? Math.round(completions.reduce((sum, c) => sum + (c.accuracy || 0), 0) / completions.length)
        : 0;

      return {
        totalStudents,
        approvedStudents,
        pendingStudents,
        totalLessons: lessonCount || 0,
        totalCompletions,
        totalPointsAwarded,
        avgWpm,
        avgAccuracy
      };
    } catch (error) {
      console.error('Error fetching stats:', error);

      // Fallback to calculating from already loaded data
      return {
        totalStudents: users.length,
        approvedStudents: users.filter(u => u.status === 'approved').length,
        pendingStudents: users.filter(u => u.status === 'pending').length,
        totalLessons: lessons.length,
        totalCompletions: 0,
        totalPointsAwarded: 0,
        avgWpm: 0,
        avgAccuracy: 0
      };
    }
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'denied') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.from('classes').delete().eq('id', lessonId);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-300',
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      denied: 'bg-rose-100 text-rose-700 border-rose-300',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getLevelBadge = (level?: string) => {
    if (!level) return <span className="text-gray-400 text-sm">Not assessed</span>;
    const styles = {
      beginner: 'bg-sky-100 text-sky-700 border-sky-300',
      intermediate: 'bg-orange-100 text-orange-700 border-orange-300',
      advanced: 'bg-purple-100 text-purple-700 border-purple-300',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[level as keyof typeof styles]}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const getRankBadge = (rank: string) => {
    const colors: Record<string, string> = {
      'S-Rank': 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-400',
      'A-Rank': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-400',
      'B-Rank': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-400',
      'C-Rank': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-400',
      'D-Rank': 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${colors[rank] || colors['D-Rank']}`}>
        {rank}
      </span>
    );
  };

  const getLeaderboardUsers = () => {
    return [...users]
      .filter(u => u.ranking)
      .sort((a, b) => (a.ranking?.overall_position || 999) - (b.ranking?.overall_position || 999));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-slate-600 font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-purple-100">
      <nav className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/type mind.png" alt="TypeMindAI" className="w-16 h-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  TypeMindAI
                </h1>
                <p className="text-sm text-slate-600">Administrator Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium"
              style={{ backgroundColor: '#531b93' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#42166f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531b93'}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-3 mb-8 flex-wrap">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'users', icon: Users, label: `Users (${users.length})` },
            { id: 'lessons', icon: BookOpen, label: `Lessons (${lessons.length})` },
            { id: 'admins', icon: Shield, label: 'Admins' },
            { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg ${
                activeTab === tab.id
                  ? 'text-white scale-105'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              style={activeTab === tab.id ? { backgroundColor: '#531b93' } : {}}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(to bottom right, #531b93, #3d1470)' }}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <Sparkles className="w-5 h-5" style={{ color: '#531b93' }} />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalStudents}</div>
                <div className="text-sm text-slate-600 font-medium">Total Students</div>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="text-emerald-600 font-semibold">✓ {stats.approvedStudents} Active</span>
                  <span className="text-amber-600 font-semibold">⏳ {stats.pendingStudents} Pending</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(to bottom right, #009193, #006d6f)' }}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <Target className="w-5 h-5" style={{ color: '#009193' }} />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalLessons}</div>
                <div className="text-sm text-slate-600 font-medium">Total Lessons</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-full" style={{ background: 'linear-gradient(to right, #009193, #006d6f)' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(to bottom right, #531b93, #3d1470)' }}>
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5" style={{ color: '#531b93' }} />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalCompletions}</div>
                <div className="text-sm text-slate-600 font-medium">Lesson Completions</div>
                <div className="mt-3 text-xs font-semibold" style={{ color: '#531b93' }}>
                  {stats.totalPointsAwarded.toLocaleString()} Points Awarded
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(to bottom right, #009193, #006d6f)' }}>
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <Award className="w-5 h-5" style={{ color: '#009193' }} />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stats.avgWpm}</div>
                <div className="text-sm text-slate-600 font-medium">Avg. WPM</div>
                <div className="mt-3 text-xs text-slate-600 font-medium">
                  {stats.avgAccuracy}% Avg. Accuracy
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <PieChart className="w-6 h-6" style={{ color: '#531b93' }} />
                  <h3 className="text-xl font-bold text-slate-900">Student Status Distribution</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        Approved Students
                      </span>
                      <span className="text-sm font-bold text-emerald-600">{stats.approvedStudents}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                        style={{ width: `${stats.totalStudents > 0 ? (stats.approvedStudents / stats.totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-amber-600" />
                        Pending Approval
                      </span>
                      <span className="text-sm font-bold text-amber-600">{stats.pendingStudents}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                        style={{ width: `${stats.totalStudents > 0 ? (stats.pendingStudents / stats.totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="w-6 h-6" style={{ color: '#009193' }} />
                  <h3 className="text-xl font-bold text-slate-900">Top Performers</h3>
                </div>
                <div className="space-y-3">
                  {getLeaderboardUsers().slice(0, 3).map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                        'bg-gradient-to-br from-orange-400 to-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{user.full_name}</div>
                        <div className="text-xs text-slate-600">{user.ranking?.total_points} points</div>
                      </div>
                      {user.ranking && getRankBadge(user.ranking.rank_grade)}
                    </div>
                  ))}
                  {getLeaderboardUsers().length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No rankings yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl shadow-2xl p-8 text-white" style={{ background: 'linear-gradient(to bottom right, #531b93, #3d1470)' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Platform Insights</h3>
                  <p className="text-purple-100">Real-time analytics and metrics</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-3xl font-bold mb-1">
                    {users.filter(u => u.ranking).length}
                  </div>
                  <div className="text-sm text-purple-100">Active Learners</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-3xl font-bold mb-1">
                    {stats.totalCompletions > 0 ? Math.round(stats.totalCompletions / stats.totalLessons) : 0}
                  </div>
                  <div className="text-sm text-purple-100">Avg. Completions/Lesson</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-3xl font-bold mb-1">
                    {users.filter(u => u.ranking && u.ranking.overall_position <= 10).length}
                  </div>
                  <div className="text-sm text-purple-100">Top 10 Users</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-3xl font-bold mb-1">
                    {Math.round((stats.approvedStudents / Math.max(stats.totalStudents, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-purple-100">Approval Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Level</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{user.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getLevelBadge(user.level)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.ranking ? getRankBadge(user.ranking.rank_grade) : <span className="text-slate-400 text-sm">No rank</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.status === 'pending' && (
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => updateUserStatus(user.id, 'approved')}
                                className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateUserStatus(user.id, 'denied')}
                                className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
                                title="Deny"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedUser && (
              <StudentAnalytics
                user={selectedUser}
                ranking={selectedUser.ranking}
                onClose={() => setSelectedUser(null)}
              />
            )}
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Lesson Management</h2>
                <p className="text-slate-600 mt-1">Create and manage typing lessons</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold"
                style={{ backgroundColor: '#009193' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#006d6f'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009193'}
              >
                <Plus className="w-5 h-5" />
                Create Lesson
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-xl transition-all relative bg-gradient-to-br from-white to-slate-50">
                  <button
                    onClick={() => deleteLesson(lesson.id)}
                    className="absolute top-4 right-4 p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
                    title="Delete Lesson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-lg text-slate-900 mb-3 pr-10">{lesson.title}</h3>
                  <div className="flex gap-2 mb-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 text-xs rounded-full font-semibold capitalize">
                      {lesson.level}
                    </span>
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs rounded-full font-semibold capitalize">
                      {lesson.module_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-3">{lesson.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#531b93' }}>
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Admin Accounts</h2>
                <p className="text-slate-600">Manage administrator access</p>
              </div>
            </div>

            <div className="space-y-4">
              {users.filter(user => user.role === 'admin').map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-200 hover:border-purple-300 transition-all bg-gradient-to-r from-purple-50 to-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#009193' }}>
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-slate-900">{admin.full_name}</div>
                      <div className="text-sm text-slate-600">{admin.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#531b93' }}>
                      Administrator
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      admin.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : admin.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {admin.status}
                    </span>
                  </div>
                </div>
              ))}

              {users.filter(user => user.role === 'admin').length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  <Shield className="w-20 h-20 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No admin accounts found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Global Leaderboard</h2>
                <p className="text-slate-600">Top performing students</p>
              </div>
            </div>

            <div className="space-y-4">
              {getLeaderboardUsers().map((user, index) => {
                const position = user.ranking?.overall_position || index + 1;
                const isTop3 = position <= 3;
                const medalColor = position === 1 ? 'text-yellow-500' : position === 2 ? 'text-slate-400' : 'text-orange-500';
                const bgGradient = position === 1
                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
                  : position === 2
                  ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-300'
                  : position === 3
                  ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300'
                  : 'bg-slate-50 border-slate-200';

                return (
                  <div
                    key={user.id}
                    className={`flex items-center gap-6 p-6 rounded-xl border-2 transition-all hover:shadow-lg ${bgGradient}`}
                  >
                    <div className="flex-shrink-0 w-16 text-center">
                      {isTop3 ? (
                        <Medal className={`w-12 h-12 mx-auto ${medalColor}`} />
                      ) : (
                        <span className="text-3xl font-bold text-slate-500">#{position}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="font-bold text-xl text-slate-900">{user.full_name}</div>
                      <div className="text-sm text-slate-600">{user.email}</div>
                    </div>

                    {user.ranking && (
                      <>
                        <div className="text-center px-6">
                          <div className="text-xs text-slate-600 mb-1 font-medium">Rank</div>
                          {getRankBadge(user.ranking.rank_grade)}
                        </div>

                        <div className="text-center px-6">
                          <div className="text-xs text-slate-600 mb-1 font-medium">Points</div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            {user.ranking.total_points}
                          </div>
                        </div>

                        <div className="text-center px-6">
                          <div className="text-xs text-slate-600 mb-1 font-medium">WPM</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(user.ranking.average_wpm)}
                          </div>
                        </div>

                        <div className="text-center px-6">
                          <div className="text-xs text-slate-600 mb-1 font-medium">Accuracy</div>
                          <div className="text-2xl font-bold text-emerald-600">
                            {Math.round(user.ranking.average_accuracy)}%
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {getLeaderboardUsers().length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  <Trophy className="w-20 h-20 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No users have completed lessons yet.</p>
                  <p className="text-sm mt-2">The leaderboard will populate as students complete lessons.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};
