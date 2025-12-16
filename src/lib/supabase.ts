import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student';
  status: 'pending' | 'approved' | 'denied';
  level?: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  title: string;
  content: string | null;
  transcript?: string | null;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  module_type: 'text' | 'audio_sentence' | 'audio_paragraph';
  audio_url?: string | null;
  audio_source?: 'elevenlabs' | 'upload' | null;
  voice_id?: string | null;
  playback_speed?: number | null;
  backspace_enabled?: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Assessment {
  id: string;
  student_id: string;
  wpm: number;
  accuracy: number;
  text_content: string;
  created_at: string;
}

export interface Progress {
  id: string;
  student_id: string;
  class_id: string;
  completed: boolean;
  time_spent_minutes: number;
  wpm: number;
  accuracy: number;
  created_at: string;
  updated_at: string;
}
