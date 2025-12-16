import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Target } from 'lucide-react';

const assessmentTexts = [
  'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is commonly used for typing practice.',
  'Technology has transformed the way we communicate and work in modern society. Computers and smartphones have become essential tools for daily life.',
  'Learning new skills requires dedication, practice, and patience. Success comes to those who persist through challenges and never give up on their goals.',
];

interface InitialAssessmentProps {
  onComplete: () => void;
}

export const InitialAssessment: React.FC<InitialAssessmentProps> = ({ onComplete }) => {
  const { profile } = useAuth();
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const randomText = assessmentTexts[Math.floor(Math.random() * assessmentTexts.length)];
    setText(randomText);
  }, []);

  const handleStart = () => {
    setStarted(true);
    setStartTime(Date.now());
    inputRef.current?.focus();
  };

  const calculateResults = () => {
    if (!startTime) return;

    const timeInMinutes = (Date.now() - startTime) / 60000;
    const wordsTyped = userInput.trim().split(/\s+/).length;
    const calculatedWpm = Math.round(wordsTyped / timeInMinutes);

    let correctChars = 0;
    for (let i = 0; i < Math.min(userInput.length, text.length); i++) {
      if (userInput[i] === text[i]) correctChars++;
    }
    const calculatedAccuracy = Math.round((correctChars / text.length) * 100);

    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy);

    let determinedLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (calculatedWpm >= 60) {
      determinedLevel = 'advanced';
    } else if (calculatedWpm >= 40) {
      determinedLevel = 'intermediate';
    }
    setLevel(determinedLevel);

    setEndTime(Date.now());
    setFinished(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setUserInput(value);

    if (value.length >= text.length) {
      calculateResults();
    }
  };

  const saveResults = async () => {
    try {
      if (!profile?.id) {
        throw new Error('User profile not found');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      onComplete();
    } catch (error: any) {
      console.error('Error saving results:', error);
      alert(`Failed to save results: ${error.message || 'Unknown error'}`);
    }
  };

  const getCharacterClass = (index: number) => {
    if (index >= userInput.length) return 'text-gray-400';
    if (userInput[index] === text[index]) return 'text-green-600';
    return 'text-red-600';
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Initial Assessment</h2>
          <p className="text-gray-600 mb-6">
            Welcome! Before you start your typing journey, we need to assess your current typing speed.
            This will help us assign you to the appropriate level.
          </p>
          <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Assessment Levels:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span><strong>Beginner:</strong> Below 40 WPM</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span><strong>Intermediate:</strong> 40-60 WPM</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span><strong>Advanced:</strong> Above 60 WPM</span>
              </li>
            </ul>
          </div>
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Assessment Complete!</h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">{wpm}</div>
              <div className="text-sm text-gray-600">Words Per Minute</div>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">{accuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>

          <div className="bg-blue-100 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Your Level:</h3>
            <div className="text-2xl font-bold text-blue-600">
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </div>
          </div>

          <button
            onClick={saveResults}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Type the text below</h2>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span className="font-mono">
              {startTime ? Math.floor((Date.now() - startTime) / 1000) : 0}s
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 font-mono text-lg leading-relaxed">
          {text.split('').map((char, index) => (
            <span key={index} className={getCharacterClass(index)}>
              {char}
            </span>
          ))}
        </div>

        <textarea
          ref={inputRef}
          value={userInput}
          onChange={handleInputChange}
          className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg resize-none"
          rows={6}
          placeholder="Start typing here..."
          autoFocus
        />

        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>Progress: {userInput.length} / {text.length} characters</div>
          <div>Press Enter to finish early or type the complete text</div>
        </div>
      </div>
    </div>
  );
};
