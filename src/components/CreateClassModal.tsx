import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AudioLessonCreator } from './AudioLessonCreator';

interface CreateClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const healthcareTexts = {
  beginner: [
    'The patient needs vital signs checked. Blood pressure is measured in the exam room. Take temperature readings carefully.',
    'Medical records must be kept secure. Patient privacy is very important. HIPAA rules protect health information.',
    'Nurses wear scrubs to work. They check patient charts daily. Medicine is given at specific times.',
    'The doctor orders lab tests. Results come back quickly. Technicians process blood samples carefully.',
    'Hospital beds are cleaned often. Hand washing prevents infection. Sterile gloves must be worn.',
  ],
  intermediate: [
    'Healthcare professionals must document patient assessments accurately in electronic health records. Proper documentation ensures continuity of care and legal compliance.',
    'Medication administration requires careful verification using the five rights protocol. Nurses must check dosage, route, time, patient identity, and medication name before each administration.',
    'Infection control protocols include proper hand hygiene, use of personal protective equipment, and environmental cleaning. These measures reduce hospital-acquired infections significantly.',
    'Diagnostic imaging techniques such as X-rays, CT scans, and MRI provide valuable information for treatment planning. Radiologic technologists operate sophisticated medical equipment.',
    'Patient education improves health outcomes and medication adherence. Healthcare providers explain treatment plans, potential side effects, and lifestyle modifications clearly.',
  ],
  advanced: [
    'Comprehensive patient assessment involves systematic evaluation of physiological, psychological, and social factors affecting health outcomes. Healthcare providers utilize evidence-based clinical guidelines to formulate appropriate differential diagnoses and treatment protocols while considering individual patient circumstances, comorbidities, and contraindications.',
    'Pharmacological interventions require thorough understanding of drug mechanisms, therapeutic indices, adverse reactions, and potential drug interactions. Clinical pharmacists collaborate with physicians to optimize medication regimens, monitor therapeutic efficacy, and prevent adverse drug events through comprehensive medication reconciliation processes.',
    'Electronic health record systems facilitate interdisciplinary communication, clinical decision support, and quality improvement initiatives within healthcare organizations. Implementation of standardized terminology, interoperability standards, and data security measures ensures accurate information exchange while maintaining patient confidentiality.',
    'Evidence-based practice integrates current research findings, clinical expertise, and patient preferences to deliver high-quality healthcare. Systematic literature reviews, meta-analyses, and randomized controlled trials provide the foundation for clinical practice guidelines that standardize care delivery.',
  ],
};

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all'>('beginner');
  const [moduleType, setModuleType] = useState<'text' | 'audio_sentence' | 'audio_paragraph'>('text');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [backspaceEnabled, setBackspaceEnabled] = useState(true);
  const [audioData, setAudioData] = useState<{
    audioUrl: string;
    audioFile?: File;
    transcript: string;
    audioSource: 'elevenlabs' | 'upload';
    voiceId?: string;
    playbackSpeed?: number;
  } | null>(null);

  const generateContent = async () => {
    setGenerating(true);

    setTimeout(() => {
      const selectedLevel = level === 'all' ? 'intermediate' : level;
      const texts = healthcareTexts[selectedLevel];
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      setContent(randomText);
      setGenerating(false);
    }, 500);
  };

  const uploadAudioToStorage = async (audioUrl: string, audioFile?: File): Promise<string | null> => {
    try {
      let blob: Blob;
      let fileExtension = 'mp3';

      // If we have the original File object, use it directly
      if (audioFile) {
        console.log('Using original file object:', audioFile.name, audioFile.type);
        blob = audioFile;
        // Extract file extension from the original file
        const nameParts = audioFile.name.split('.');
        if (nameParts.length > 1) {
          fileExtension = nameParts[nameParts.length - 1];
        }
      } else if (audioUrl.startsWith('blob:')) {
        // Fetch the blob from the blob URL (for generated audio)
        console.log('Fetching blob from URL');
        const response = await fetch(audioUrl);
        blob = await response.blob();
      } else if (audioUrl.startsWith('data:')) {
        // Convert data URL to blob
        console.log('Converting data URL to blob');
        const base64Data = audioUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'audio/mpeg' });
      } else {
        throw new Error('Invalid audio URL format');
      }

      const fileName = `${profile?.id}-${Date.now()}.${fileExtension}`;
      const filePath = `audio/${fileName}`;

      console.log('Uploading to storage:', filePath, blob.size, blob.type);

      const { error: uploadError } = await supabase.storage
        .from('class-audio')
        .upload(filePath, blob, {
          contentType: blob.type || 'audio/mpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('class-audio')
        .getPublicUrl(filePath);

      console.log('Audio uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Failed to upload audio file. Error: ' + (error instanceof Error ? error.message : String(error)));
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((moduleType === 'audio_sentence' || moduleType === 'audio_paragraph') && !audioData) {
      alert('Please create audio for this lesson');
      return;
    }

    setLoading(true);

    try {
      let audioUrl: string | null = null;
      let transcript = content;

      if (audioData) {
        console.log('Uploading audio file to storage...');
        audioUrl = await uploadAudioToStorage(audioData.audioUrl, audioData.audioFile);
        if (!audioUrl) {
          setLoading(false);
          return;
        }
        transcript = audioData.transcript;
        console.log('Audio URL:', audioUrl);
        console.log('Transcript length:', transcript.length);
      }

      const { error } = await supabase.from('classes').insert({
        title,
        content: transcript || content,
        level,
        module_type: moduleType,
        audio_url: audioUrl,
        audio_source: audioData?.audioSource,
        voice_id: audioData?.voiceId,
        playback_speed: audioData?.playbackSpeed,
        backspace_enabled: backspaceEnabled,
        created_by: profile?.id,
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create New Lesson</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Introduction to Home Row Keys"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all">All Levels</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Type
            </label>
            <select
              value={moduleType}
              onChange={(e) => setModuleType(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="text">Text Typing</option>
              <option value="audio_sentence">Audio Sentence</option>
              <option value="audio_paragraph">Audio Paragraph</option>
            </select>
          </div>

          {(moduleType === 'audio_sentence' || moduleType === 'audio_paragraph') && (
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Setup</h3>
              <AudioLessonCreator
                onAudioCreated={(data) => {
                  setAudioData(data);
                  setContent(data.transcript);
                }}
              />
              {audioData && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                    <Sparkles className="w-5 h-5" />
                    Audio Ready
                  </div>
                  <div className="text-sm text-gray-700">
                    <div><strong>Source:</strong> {audioData.audioSource === 'elevenlabs' ? 'ElevenLabs AI' : 'Uploaded File'}</div>
                    {audioData.voiceId && <div><strong>Voice ID:</strong> {audioData.voiceId}</div>}
                    {audioData.playbackSpeed && <div><strong>Speed:</strong> {audioData.playbackSpeed}x</div>}
                    <div className="mt-2"><strong>Transcript Preview:</strong> {audioData.transcript.substring(0, 100)}...</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {moduleType === 'text' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <button
                  type="button"
                  onClick={generateContent}
                  disabled={generating}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Enter the text content for this class..."
                required
              />
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium text-gray-700">Allow Backspace</span>
                <p className="text-xs text-gray-500 mt-1">
                  When disabled, students cannot use backspace to correct mistakes during typing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBackspaceEnabled(!backspaceEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  backspaceEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    backspaceEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
