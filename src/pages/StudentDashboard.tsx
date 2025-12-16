import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Class } from '../lib/supabase';
import { LogOut, Trophy, Clock, Target, Award, TrendingUp, Zap, Medal } from 'lucide-react';
import { InitialAssessment } from '../components/InitialAssessment';
import { TypingLesson } from '../components/TypingLesson';
import { RankProgressCard } from '../components/RankProgressCard';

interface UserRanking {
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

interface Certification {
  id: string;
  rank_achieved: string;
  issued_at: string;
}

export const StudentDashboard: React.FC = () => {
  const { signOut, profile } = useAuth();
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [ranking, setRanking] = useState<UserRanking | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    checkAssessmentStatus();
    if (profile?.level) {
      fetchClasses();
      fetchRanking();
      fetchCertifications();
      fetchCompletedLessons();
    }
  }, [profile]);

  const checkAssessmentStatus = async () => {
    setLoading(true);
    if (!profile?.level) {
      setNeedsAssessment(true);
    }
    setLoading(false);
  };

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .or(`level.eq.${profile?.level},level.eq.all`)
      .order('created_at', { ascending: false });

    if (data) setClasses(data);
  };

  const fetchRanking = async () => {
    const { data } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('user_id', profile?.id || '')
      .maybeSingle();

    if (data) setRanking(data);
  };

  const fetchCertifications = async () => {
    const { data } = await supabase
      .from('certifications')
      .select('*')
      .eq('user_id', profile?.id || '')
      .order('issued_at', { ascending: false });

    if (data) setCertifications(data);
  };

  const fetchCompletedLessons = async () => {
    const { data } = await supabase
      .from('lesson_completions')
      .select('lesson_id')
      .eq('user_id', profile?.id || '');

    if (data) {
      const completedIds = new Set(data.map(item => item.lesson_id));
      setCompletedLessons(completedIds);
    }
  };

  const formatTime = (hours: number) => {
    if (!hours || isNaN(hours)) return '0h 0m';
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const downloadCertificate = async (cert: Certification) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Determine background based on rank level
    const rankLevel = cert.rank_achieved.split('-')[0];

    // Load images
    const topLogo = new Image();
    const bottomLogo = new Image();

    topLogo.src = '/type mind copy.png';
    bottomLogo.src = '/og logo 512 copy.png';

    await Promise.all([
      new Promise((resolve) => { topLogo.onload = resolve; }),
      new Promise((resolve) => { bottomLogo.onload = resolve; })
    ]);

    // White background for all certificates
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1600, 900);

    // Purple decorative corners (top-left)
    ctx.fillStyle = '#531b93';
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI / 2);
    ctx.fill();

    // Purple decorative corners (bottom-left)
    ctx.beginPath();
    ctx.arc(0, 900, 200, 1.5 * Math.PI, 0);
    ctx.fill();

    // Teal dots pattern (bottom-right)
    ctx.fillStyle = '#009193';
    const dotSize = 8;
    const dotSpacing = 20;
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 15; col++) {
        ctx.beginPath();
        ctx.arc(1300 + col * dotSpacing, 600 + row * dotSpacing, dotSize / 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Top logo - TypeMindAI
    const topLogoWidth = 250;
    const topLogoHeight = 150;
    ctx.drawImage(topLogo, (1600 - topLogoWidth) / 2, 70, topLogoWidth, topLogoHeight);

    // Main title - CERTIFICATE OF ACHIEVEMENT
    ctx.fillStyle = '#531b93';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 800, 280);

    // Subtitle
    ctx.fillStyle = '#531b93';
    ctx.font = '28px Arial';
    ctx.fillText('This certificate is proudly presented to', 800, 350);

    // Student name - TEAL
    ctx.fillStyle = '#009193';
    ctx.font = 'bold 80px Arial';
    ctx.fillText(profile?.full_name?.toUpperCase() || 'STUDENT', 800, 450);

    // Achievement text
    ctx.fillStyle = '#531b93';
    ctx.font = '32px Arial';
    ctx.fillText('for achieving ', 600, 550);

    // Grade text - TEAL
    ctx.fillStyle = '#009193';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Grade: ${rankLevel}`, 820, 550);

    // Continue achievement text
    ctx.fillStyle = '#531b93';
    ctx.font = '32px Arial';
    ctx.fillText(' in typing training.', 1020, 550);

    // Bottom logo - OG
    const bottomLogoWidth = 200;
    const bottomLogoHeight = 120;
    ctx.drawImage(bottomLogo, (1600 - bottomLogoWidth) / 2, 650, bottomLogoWidth, bottomLogoHeight);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TypeMind-Certificate-${cert.rank_achieved}-${new Date(cert.issued_at).toISOString().split('T')[0]}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'S': 'text-yellow-600 bg-yellow-50 border-yellow-300',
      'A': 'text-green-600 bg-green-50 border-green-300',
      'B': 'text-blue-600 bg-blue-50 border-blue-300',
      'C': 'text-orange-600 bg-orange-50 border-orange-300',
      'D': 'text-gray-600 bg-gray-50 border-gray-300',
    };
    return colors[rank] || colors['D'];
  };

  const getThemeStyles = (theme: string) => {
    const themes: Record<string, string> = {
      'gold': 'from-yellow-50 to-yellow-100 border-yellow-300',
      'silver': 'from-gray-100 to-gray-200 border-gray-400',
      'bronze': 'from-orange-50 to-orange-100 border-orange-300',
      'standard': 'from-purple-50 to-purple-100 border-purple-200',
    };
    return themes[theme] || themes['standard'];
  };

  const handleAssessmentComplete = () => {
    setNeedsAssessment(false);
    window.location.reload();
  };

  const handleLessonComplete = () => {
    setSelectedClass(null);
    fetchClasses();
    fetchRanking();
    fetchCompletedLessons();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-purple-600">Loading...</div>
      </div>
    );
  }

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Approval Pending</h2>
          <p className="text-gray-600 mb-6">
            Your account is awaiting admin approval. Please check back later.
          </p>
          <button
            onClick={handleSignOut}
            className="px-6 py-3 text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#531B93' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#42166f'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (profile?.status === 'denied') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Your account has been denied by an administrator.
          </p>
          <button
            onClick={handleSignOut}
            className="px-6 py-3 text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#531B93' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#42166f'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (needsAssessment) {
    return <InitialAssessment onComplete={handleAssessmentComplete} />;
  }

  if (selectedClass) {
    return (
      <TypingLesson
        classData={selectedClass}
        onComplete={handleLessonComplete}
        onBack={() => setSelectedClass(null)}
      />
    );
  }

  const themeStyles = getThemeStyles(ranking?.theme || 'standard');

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeStyles} transition-all duration-500`}>
      <div className="max-w-7xl mx-auto p-6">
        <header className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border-2 transition-all duration-500" style={{ borderColor: ranking?.theme === 'gold' ? '#fbbf24' : ranking?.theme === 'silver' ? '#9ca3af' : ranking?.theme === 'bronze' ? '#fb923c' : '#a855f7' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/type mind.png" alt="TypeMindAI" className="w-20 h-auto" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">TypeMindAI</h1>
                <p className="text-gray-600">Welcome back, {profile?.full_name}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </header>

        {ranking && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getRankColor(ranking.rank_grade.split('-')[0])}`}>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8" />
                <div>
                  <div className="text-sm text-gray-600">Rank</div>
                  <div className="text-3xl font-bold">{ranking.rank_grade}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">Position: #{ranking.overall_position}</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Total Score</div>
                  <div className="text-3xl font-bold text-purple-600">{ranking.total_points}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">Category: {ranking.rank_category}</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Average WPM</div>
                  <div className="text-3xl font-bold text-blue-600">{Math.round(ranking.average_wpm)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">{Math.round(ranking.average_accuracy)}% Accuracy</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                  <div className="text-2xl font-bold text-green-600">{formatTime(ranking.total_time_hours)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">Category Rank: #{ranking.category_position}</div>
            </div>
          </div>
        )}

        {ranking && (
          <RankProgressCard
            currentPoints={ranking.total_points}
            currentRank={ranking.rank_grade}
            currentLevel={profile?.level || 'beginner'}
            averageWpm={ranking.average_wpm}
            averageAccuracy={ranking.average_accuracy}
          />
        )}

        {certifications.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">Your Certifications</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {certifications.map((cert) => (
                <div key={cert.id} className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
                  <div className="text-center mb-3">
                    <Medal className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                    <div className="font-bold text-lg text-gray-900">{cert.rank_achieved} Achieved</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadCertificate(cert)}
                    className="w-full px-4 py-2 text-white rounded-lg transition-all text-sm font-semibold"
                    style={{ backgroundColor: '#531b93' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#42166f'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531b93'}
                  >
                    Download Certificate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Available Lessons</h2>
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No lessons available at your level yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => {
                const isCompleted = completedLessons.has(classItem.id);
                return (
                  <div
                    key={classItem.id}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-400 hover:shadow-lg transition-all relative"
                  >
                    {isCompleted && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold border border-green-300 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Completed
                        </span>
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-gray-900 mb-2 pr-24">{classItem.title}</h3>
                    <div className="flex gap-2 mb-3">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium capitalize">
                        {classItem.level}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium capitalize">
                        {classItem.module_type.replace('_', ' ')}
                      </span>
                    </div>
                    {classItem.module_type === 'text' ? (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{classItem.content}</p>
                    ) : (
                      <p className="text-gray-500 text-sm italic mb-4">Audio lesson - Listen and type</p>
                    )}
                    <button
                      onClick={() => setSelectedClass(classItem)}
                      className="w-full px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium hover:opacity-90"
                      style={{ backgroundColor: '#531b93' }}
                    >
                      {isCompleted ? 'Practice Again' : 'Start Lesson'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
