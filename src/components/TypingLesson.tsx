import React, { useState, useEffect, useRef } from 'react';
import { supabase, Class } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Volume2, VolumeX, Clock, Target, Award } from 'lucide-react';
import { useTypingSound } from '../hooks/useTypingSound';
import { VisualKeyboard } from './VisualKeyboard';

interface TypingLessonProps {
  classData: Class;
  onComplete: () => void;
  onBack: () => void;
}

const medicalPhrases = [
  "The patient's vital signs are stable and within normal range.",
  "Proper hand hygiene prevents the spread of hospital-acquired infections.",
  "The diagnostic imaging revealed no abnormalities in the chest cavity.",
  "Administering the prescribed medication according to the dosage schedule is crucial.",
];

export const TypingLesson: React.FC<TypingLessonProps> = ({ classData, onComplete, onBack }) => {
  const { profile } = useAuth();
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isFirstCompletion, setIsFirstCompletion] = useState(true);
  const [currentWpm, setCurrentWpm] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [unfixedErrors, setUnfixedErrors] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { playTypingSound, soundEnabled, toggleSound } = useTypingSound();
  const backspaceEnabled = classData.backspace_enabled ?? true;

  const lessonText = classData.content || '';

  if (!lessonText) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Missing</h2>
          <p className="text-gray-600 mb-6">
            This lesson doesn't have any content to type. Please contact an administrator.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    checkIfFirstCompletion();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (started && !finished && startTime) {
      const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;

      if (totalKeystrokes === 0) {
        setCurrentWpm(0);
        setCurrentAccuracy(0);
        return;
      }

      const elapsedMinutes = (Date.now() - startTime) / 60000;

      if (elapsedMinutes <= 0) {
        setCurrentWpm(0);
        setCurrentAccuracy(0);
        return;
      }

      const charactersPerWord = 5;
      const grossWpm = (totalKeystrokes / charactersPerWord) / elapsedMinutes;

      // For audio lessons, show gross WPM (typing speed without error penalty)
      // For text lessons, show net WPM (typing speed with error penalty)
      let calculatedWpm;
      if (classData.module_type === 'audio_sentence' || classData.module_type === 'audio_paragraph') {
        calculatedWpm = Math.round(grossWpm);
      } else {
        const netWpm = Math.max(0, grossWpm - (unfixedErrors / elapsedMinutes));
        calculatedWpm = Math.round(netWpm);
      }

      const calculatedAccuracy = Math.round((correctKeystrokes / totalKeystrokes) * 100);

      setCurrentWpm(calculatedWpm);
      setCurrentAccuracy(calculatedAccuracy);
    }
  }, [correctKeystrokes, incorrectKeystrokes, unfixedErrors, started, finished, startTime, timeSpent, classData.module_type]);

  const checkIfFirstCompletion = async () => {
    try {
      const { data } = await supabase
        .from('lesson_completions')
        .select('id')
        .eq('user_id', profile?.id)
        .eq('lesson_id', classData.id)
        .maybeSingle();

      setIsFirstCompletion(!data);
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  };

  const handleStart = () => {
    setStarted(true);
    setStartTime(Date.now());
    inputRef.current?.focus();

    timerRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
  };

  const speakText = () => {
    if (classData.audio_url) {
      const audio = new Audio(classData.audio_url);
      audio.play();
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(lessonText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    }
  };

  const calculateScore = (wpm: number, accuracy: number): number => {
    // Balanced scoring: ~30-50 points per lesson with good performance
    // WPM contribution: 0-25 points (max at 100 WPM)
    const wpmScore = Math.min(wpm * 0.25, 25);

    // Accuracy contribution: 0-25 points (max at 100% accuracy)
    const accuracyScore = accuracy * 0.25;

    // Bonus points for excellent performance (both high WPM and accuracy)
    const bonusMultiplier = (wpm >= 60 && accuracy >= 95) ? 1.2 : 1.0;

    return Math.round((wpmScore + accuracyScore) * bonusMultiplier);
  };

  const calculateResults = () => {
    if (!startTime) return;

    const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;

    if (totalKeystrokes === 0) {
      setWpm(0);
      setAccuracy(0);
      setScore(0);
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const elapsedMinutes = (Date.now() - startTime) / 60000;
    const charactersPerWord = 5;

    const grossWpm = (totalKeystrokes / charactersPerWord) / elapsedMinutes;

    // For audio lessons, use gross WPM (typing speed without error penalty)
    // For text lessons, use net WPM (typing speed with error penalty)
    let calculatedWpm;
    if (classData.module_type === 'audio_sentence' || classData.module_type === 'audio_paragraph') {
      calculatedWpm = Math.round(grossWpm);
    } else {
      const netWpm = Math.max(0, grossWpm - (unfixedErrors / elapsedMinutes));
      calculatedWpm = Math.round(netWpm);
    }

    const calculatedAccuracy = Math.round((correctKeystrokes / totalKeystrokes) * 100);
    const calculatedScore = calculateScore(calculatedWpm, calculatedAccuracy);

    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy);
    setScore(calculatedScore);
    setFinished(true);

    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!backspaceEnabled && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      return;
    }

    setActiveKey(e.key);
    playTypingSound();

    setTimeout(() => {
      setActiveKey(null);
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const prevLength = userInput.length;

    if (value.length > prevLength) {
      const newCharIndex = value.length - 1;
      const isCorrect = value[newCharIndex] === lessonText[newCharIndex];

      if (isCorrect) {
        setCorrectKeystrokes(prev => prev + 1);
      } else {
        setIncorrectKeystrokes(prev => prev + 1);
      }
    } else if (value.length < prevLength) {
      const deletedCharIndex = value.length;
      const wasCorrect = userInput[deletedCharIndex] === lessonText[deletedCharIndex];

      if (wasCorrect) {
        setCorrectKeystrokes(prev => Math.max(0, prev - 1));
      } else {
        setIncorrectKeystrokes(prev => Math.max(0, prev - 1));
      }
    }

    let errorCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== lessonText[i]) {
        errorCount++;
      }
    }
    setUnfixedErrors(errorCount);

    setUserInput(value);

    if (value.length >= lessonText.length) {
      calculateResults();
    }
  };

  const saveProgress = async () => {
    try {
      const { error: completionError } = await supabase
        .from('lesson_completions')
        .insert({
          user_id: profile?.id,
          lesson_id: classData.id,
          score,
          accuracy,
          wpm,
          time_spent: timeSpent,
          is_first_completion: isFirstCompletion,
        });

      if (completionError) throw completionError;

      await supabase.rpc('update_leaderboard_positions');

      onComplete();
    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Failed to save progress');
    }
  };

  const getCharacterClass = (index: number) => {
    if (index >= userInput.length) return 'text-gray-400';
    if (userInput[index] === lessonText[index]) return 'text-green-600 bg-green-50';
    return 'text-red-600 bg-red-50';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">{classData.title}</h2>

          {classData.module_type === 'text' && (
            <div className="bg-purple-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 leading-relaxed text-lg">{lessonText}</p>
            </div>
          )}

          {(classData.module_type === 'audio_sentence' || classData.module_type === 'audio_paragraph') && (
            <div className="bg-green-50 rounded-lg p-6 mb-6 text-center">
              <p className="text-gray-700 text-lg mb-2">
                This is an audio lesson. Listen carefully and type what you hear.
              </p>
              <p className="text-sm text-gray-500">
                The text is hidden - focus on listening!
              </p>
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-white border border-purple-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Level</div>
              <div className="font-semibold text-gray-900 capitalize">{classData.level}</div>
            </div>
            <div className="flex-1 bg-white border border-purple-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Type</div>
              <div className="font-semibold text-gray-900 capitalize">
                {classData.module_type.replace('_', ' ')}
              </div>
            </div>
          </div>

          {!isFirstCompletion && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <Award className="w-4 h-4 inline mr-2" />
                You've completed this lesson before. Replaying won't affect your ranking.
              </p>
            </div>
          )}

          {(classData.module_type === 'audio_sentence' || classData.module_type === 'audio_paragraph') && (
            <button
              onClick={speakText}
              className="w-full mb-4 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Volume2 className="w-5 h-5" />
              Play Medical Audio
            </button>
          )}

          <button
            onClick={handleStart}
            className="w-full px-8 py-4 text-white rounded-lg transition-colors text-lg font-medium"
            style={{ backgroundColor: '#531B93' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#42166f'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
          >
            Start Lesson
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Lesson Complete!</h2>

          {isFirstCompletion && (
            <p className="text-purple-600 font-medium mb-6">+{score} points added to your ranking</p>
          )}
          {!isFirstCompletion && (
            <p className="text-yellow-600 font-medium mb-6">Practice session - no points awarded</p>
          )}

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">{score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">{wpm}</div>
              <div className="text-sm text-gray-600">WPM</div>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">{accuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">{formatTime(timeSpent)}</div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={saveProgress}
              className="flex-1 px-6 py-3 text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#531B93' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#42166f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
            >
              Save Progress
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100"
      style={{ paddingBottom: '320px' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="p-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{classData.title}</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSound}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm ${
                  soundEnabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title={soundEnabled ? 'Sound: ON' : 'Sound: OFF'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-xs font-medium">{soundEnabled ? 'ON' : 'OFF'}</span>
              </button>
              {(classData.module_type === 'audio_sentence' || classData.module_type === 'audio_paragraph') && (
                <button
                  onClick={speakText}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  Play
                </button>
              )}
            </div>
          </div>

          {classData.module_type === 'text' && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 font-mono text-2xl leading-relaxed">
              {lessonText.split('').map((char, index) => (
                <span key={index} className={getCharacterClass(index)}>
                  {char}
                </span>
              ))}
            </div>
          )}

          {(classData.module_type === 'audio_sentence' || classData.module_type === 'audio_paragraph') && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-sm text-gray-600 mb-2 font-medium">Your Typing:</div>
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4 min-h-[120px] font-mono text-xl leading-relaxed whitespace-pre-wrap break-words">
                {userInput || <span className="text-gray-400 italic">Start typing what you hear...</span>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Accuracy</div>
              <div className="text-3xl font-bold text-green-600">{currentAccuracy}%</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Duration</div>
              <div className="text-3xl font-bold text-orange-600">{formatTime(timeSpent)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Speed</div>
              <div className="text-3xl font-bold text-blue-600">{currentWpm} <span className="text-lg">wpm</span></div>
            </div>
          </div>

          <textarea
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 pointer-events-none"
            rows={1}
            autoFocus
            tabIndex={0}
            aria-hidden="false"
          />

          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>Progress: {userInput.length} / {lessonText.length} characters</div>
            <button
              onClick={calculateResults}
              className="px-4 py-2 text-white rounded transition-colors"
              style={{ backgroundColor: '#531B93' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#42166f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#531B93'}
            >
              Finish Early
            </button>
          </div>
        </div>
      </div>

      <VisualKeyboard activeKey={activeKey} backspaceEnabled={backspaceEnabled} />
    </div>
  );
};
