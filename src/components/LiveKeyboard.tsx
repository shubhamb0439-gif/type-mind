import React, { useEffect, useState } from 'react';

interface LiveKeyboardProps {
  activeKey: string | null;
  currentWpm?: number;
  currentAccuracy?: number;
}

const keyboardLayout = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Option', 'Space', 'Option', 'Ctrl']
];

const fingerKeyMap: Record<string, string> = {
  '`': 'left-pinky', '1': 'left-pinky', '2': 'left-ring', '3': 'left-middle', '4': 'left-index', '5': 'left-index',
  '6': 'right-index', '7': 'right-index', '8': 'right-middle', '9': 'right-ring', '0': 'right-pinky', '-': 'right-pinky', '=': 'right-pinky',
  'Q': 'left-pinky', 'W': 'left-ring', 'E': 'left-middle', 'R': 'left-index', 'T': 'left-index',
  'Y': 'right-index', 'U': 'right-index', 'I': 'right-middle', 'O': 'right-ring', 'P': 'right-pinky', '[': 'right-pinky', ']': 'right-pinky', '\\': 'right-pinky',
  'A': 'left-pinky', 'S': 'left-ring', 'D': 'left-middle', 'F': 'left-index', 'G': 'left-index',
  'H': 'right-index', 'J': 'right-index', 'K': 'right-middle', 'L': 'right-ring', ';': 'right-pinky', '\'': 'right-pinky',
  'Z': 'left-pinky', 'X': 'left-ring', 'C': 'left-middle', 'V': 'left-index', 'B': 'left-index',
  'N': 'right-index', 'M': 'right-index', ',': 'right-middle', '.': 'right-ring', '/': 'right-pinky',
  ' ': 'thumb', 'SPACE': 'thumb'
};

export const LiveKeyboard: React.FC<LiveKeyboardProps> = ({ activeKey, currentWpm = 0, currentAccuracy = 0 }) => {
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [activeFinger, setActiveFinger] = useState<string | null>(null);

  useEffect(() => {
    if (activeKey) {
      const upperKey = activeKey.toUpperCase();
      setHighlightedKey(upperKey);
      setActiveFinger(fingerKeyMap[upperKey] || fingerKeyMap[activeKey] || null);

      const timer = setTimeout(() => {
        setHighlightedKey(null);
        setActiveFinger(null);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [activeKey]);

  const getKeyClasses = (key: string) => {
    const baseClasses = 'rounded border-2 font-medium text-sm transition-all duration-100 flex items-center justify-center';
    const isActive = highlightedKey === key ||
                     (key === 'SPACE' && highlightedKey === ' ') ||
                     (key === 'Space' && highlightedKey === ' ');

    if (isActive) {
      return `${baseClasses} bg-blue-500 text-white border-blue-600 shadow-lg scale-105`;
    }
    return `${baseClasses} bg-white text-gray-700 border-gray-300 shadow-sm hover:bg-gray-50`;
  };

  const getKeyWidth = (key: string) => {
    if (key === 'Backspace') return '80px';
    if (key === 'Tab') return '70px';
    if (key === 'CapsLock') return '85px';
    if (key === 'Enter') return '90px';
    if (key === 'Shift') return '100px';
    if (key === 'Space') return '320px';
    if (key === 'Ctrl' || key === 'Option') return '60px';
    return '48px';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-100 to-gray-50 border-t-2 border-gray-300 py-6 z-40 shadow-2xl">
      <div className="max-w-6xl mx-auto relative px-4 flex items-start gap-8">
        {/* Keyboard with Hand Overlays */}
        <div className="flex-1 relative">
          <svg
            className="absolute pointer-events-none z-10"
            style={{ width: '100%', height: '320px', top: '-30px', left: '0' }}
            viewBox="0 0 900 320"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* LEFT HAND - realistic curved fingers from hand base */}
            <g>
              {/* Left Pinky - curved from hand to A/Q/Z keys */}
              <path
                d="M 60,190 Q 55,180 58,170 C 60,155 62,135 64,115 Q 66,90 68,70 Q 70,50 72,35 Q 74,20 76,10 Q 78,2 82,0 L 88,2 Q 92,5 90,15 Q 88,30 86,50 Q 84,75 82,100 Q 80,125 78,145 Q 76,165 74,180 Q 72,195 68,200 Z"
                fill={activeFinger === 'left-pinky' ? '#4A90E2' : '#94A3B8'}
                stroke={activeFinger === 'left-pinky' ? '#2563EB' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'left-pinky' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />

              {/* Left Ring - curved from hand to S/W/X keys */}
              <path
                d="M 90,200 Q 85,190 88,175 C 90,155 93,130 96,105 Q 99,75 102,50 Q 105,25 108,10 Q 111,0 115,-5 L 121,-5 Q 125,-2 123,10 Q 120,30 117,55 Q 114,85 111,115 Q 108,145 105,170 Q 102,190 98,202 Z"
                fill={activeFinger === 'left-ring' ? '#4A90E2' : '#94A3B8'}
                stroke={activeFinger === 'left-ring' ? '#2563EB' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'left-ring' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />

              {/* Left Middle - longest, curved from hand to D/E/C keys */}
              <path
                d="M 125,205 Q 120,195 123,175 C 126,150 130,120 134,90 Q 138,55 142,25 Q 146,5 150,-10 Q 154,-20 158,-25 L 164,-25 Q 168,-20 166,-5 Q 162,20 158,50 Q 154,85 150,120 Q 146,155 142,185 Q 138,200 132,208 Z"
                fill={activeFinger === 'left-middle' ? '#4A90E2' : '#94A3B8'}
                stroke={activeFinger === 'left-middle' ? '#2563EB' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'left-middle' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />

              {/* Left Index - curved from hand to F/R/V keys */}
              <path
                d="M 165,202 Q 160,192 163,172 C 166,145 170,115 174,85 Q 178,50 182,25 Q 186,10 190,0 Q 194,-8 198,-12 L 204,-12 Q 208,-8 206,5 Q 202,25 198,55 Q 194,90 190,125 Q 186,160 182,185 Q 178,198 172,205 Z"
                fill={activeFinger === 'left-index' ? '#4A90E2' : '#94A3B8'}
                stroke={activeFinger === 'left-index' ? '#2563EB' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'left-index' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />

              {/* Left Thumb - curved from hand to spacebar */}
              <path
                d="M 240,220 Q 230,210 225,200 C 220,185 218,170 220,155 Q 222,145 228,140 L 240,135 Q 250,133 258,138 Q 265,143 268,152 L 270,165 Q 270,180 265,195 Q 260,210 250,218 Z"
                fill={activeFinger === 'thumb' ? '#22C55E' : '#94A3B8'}
                stroke={activeFinger === 'thumb' ? '#16A34A' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'thumb' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />
            </g>

            {/* RIGHT HAND - realistic curved fingers from hand base */}
            <g>
              {/* Right Index - curved from hand to J/U/N keys */}
              <path
                d="M 405,202 Q 410,192 407,172 C 404,145 400,115 396,85 Q 392,50 388,25 Q 384,10 380,0 Q 376,-8 372,-12 L 366,-12 Q 362,-8 364,5 Q 368,25 372,55 Q 376,90 380,125 Q 384,160 388,185 Q 392,198 398,205 Z"
                fill={activeFinger === 'right-index' ? '#4A90E2' : '#94A3B8'}
                stroke={activeFinger === 'right-index' ? '#2563EB' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'right-index' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />

              {/* Right Middle - longest, curved from hand to K/I keys */}
              <path
                d="M 445,205 Q 450,195 447,175 C 444,150 440,120 436,90 Q 432,55 428,25 Q 424,5 420,-10 Q 416,-20 412,-25 L 406,-25 Q 402,-20 404,-5 Q 408,20 412,50 Q 416,85 420,120 Q 424,155 428,185 Q 432,200 438,208 Z"
                fill={activeFinger === 'right-middle' ? '#4A90E2' : '#94A3B8'}
                stroke={activeFinger === 'right-middle' ? '#2563EB' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'right-middle' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />

              {/* Right Ring - curved from hand to L/O keys */}
              <path
                d="M 480,200 Q 485,190 482,175 C 480,155 477,130 474,105 Q 471,75 468,50 Q 465,25 462,10 Q 459,0 455,-5 L 449,-5 Q 445,-2 447,10 Q 450,30 453,55 Q 456,85 459,115 Q 462,145 465,170 Q 468,190 472,202 Z"
                fill={activeFinger === 'right-ring' ? '#4A90E2' : '#94A3B8'}
                stroke={activeFinger === 'right-ring' ? '#2563EB' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'right-ring' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />

              {/* Right Pinky - curved from hand to semicolon/P keys */}
              <path
                d="M 510,190 Q 515,180 512,170 C 510,155 508,135 506,115 Q 504,90 502,70 Q 500,50 498,35 Q 496,20 494,10 Q 492,2 488,0 L 482,2 Q 478,5 480,15 Q 482,30 484,50 Q 486,75 488,100 Q 490,125 492,145 Q 494,165 496,180 Q 498,195 502,200 Z"
                fill={activeFinger === 'right-pinky' ? '#4A90E2' : '#94A3B8'}
                stroke={activeFinger === 'right-pinky' ? '#2563EB' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'right-pinky' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />

              {/* Right Thumb - curved from hand to spacebar */}
              <path
                d="M 330,220 Q 340,210 345,200 C 350,185 352,170 350,155 Q 348,145 342,140 L 330,135 Q 320,133 312,138 Q 305,143 302,152 L 300,165 Q 300,180 305,195 Q 310,210 320,218 Z"
                fill={activeFinger === 'thumb' ? '#22C55E' : '#94A3B8'}
                stroke={activeFinger === 'thumb' ? '#16A34A' : '#64748B'}
                strokeWidth="3"
                opacity={activeFinger === 'thumb' ? '0.9' : '0.1'}
                className="transition-all duration-150 ease-out"
              />
            </g>
          </svg>

          <div className="space-y-1 relative">
            {keyboardLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1">
                {row.map((key) => (
                  <div
                    key={key}
                    className={getKeyClasses(key)}
                    style={{
                      width: getKeyWidth(key),
                      height: '48px',
                      fontSize: key.length > 1 && key !== 'Space' ? '11px' : '14px'
                    }}
                  >
                    {key === 'Space' ? '' : key}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Speed and Accuracy Display */}
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="text-gray-500 text-sm font-medium mb-2">Speed</div>
            <div className="text-5xl font-bold text-gray-700">
              {currentWpm}<span className="text-2xl text-gray-400 ml-1">WPM</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 text-sm font-medium mb-2">Accuracy</div>
            <div className="text-5xl font-bold text-gray-700">
              {currentAccuracy}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
