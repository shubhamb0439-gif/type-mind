import { useCallback, useEffect, useRef, useState } from 'react';

export const useTypingSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    const savedPreference = localStorage.getItem('typingSoundEnabled');
    if (savedPreference !== null) {
      setSoundEnabled(savedPreference === 'true');
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playTypingSound = useCallback(() => {
    if (!audioContextRef.current || !soundEnabled) return;

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.05);
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('typingSoundEnabled', String(newValue));
      return newValue;
    });
  }, []);

  return { playTypingSound, soundEnabled, toggleSound };
};
