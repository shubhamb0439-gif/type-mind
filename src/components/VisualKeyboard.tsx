import React from 'react';

interface VisualKeyboardProps {
  activeKey: string | null;
  backspaceEnabled?: boolean;
}

export const VisualKeyboard: React.FC<VisualKeyboardProps> = ({ activeKey, backspaceEnabled = true }) => {
  const getKeyClass = (key: string, altKey?: string) => {
    const isActive = activeKey === key || (altKey && activeKey === altKey);
    const baseClass = "px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all";
    const activeClass = isActive ? "bg-purple-600 text-white border-purple-700" : "";
    return `${baseClass} ${activeClass}`;
  };

  const getSpecialKeyClass = (keys: string | string[], isBackspace = false) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const isActive = keyList.some(k => activeKey === k);
    const isDisabled = isBackspace && !backspaceEnabled;
    const baseClass = "px-4 py-2 border border-gray-300 rounded text-xs font-medium transition-all";
    const stateClass = isDisabled
      ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
      : "bg-gray-50 text-gray-600 hover:bg-gray-100";
    const activeClass = isActive && !isDisabled ? "bg-purple-600 text-white border-purple-700" : "";
    return `${baseClass} ${stateClass} ${activeClass}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl py-6 px-4 z-50">
      <div className="max-w-6xl mx-auto">
        {/* Number Row */}
        <div className="flex justify-center gap-1 mb-1">
          <button className={getKeyClass('`', '~')}>
            <div className="text-xs">~</div>
            <div>`</div>
          </button>
          <button className={getKeyClass('1', '!')}>
            <div className="text-xs">!</div>
            <div>1</div>
          </button>
          <button className={getKeyClass('2', '@')}>
            <div className="text-xs">@</div>
            <div>2</div>
          </button>
          <button className={getKeyClass('3', '#')}>
            <div className="text-xs">#</div>
            <div>3</div>
          </button>
          <button className={getKeyClass('4', '$')}>
            <div className="text-xs">$</div>
            <div>4</div>
          </button>
          <button className={getKeyClass('5', '%')}>
            <div className="text-xs">%</div>
            <div>5</div>
          </button>
          <button className={getKeyClass('6', '^')}>
            <div className="text-xs">^</div>
            <div>6</div>
          </button>
          <button className={getKeyClass('7', '&')}>
            <div className="text-xs">&</div>
            <div>7</div>
          </button>
          <button className={getKeyClass('8', '*')}>
            <div className="text-xs">*</div>
            <div>8</div>
          </button>
          <button className={getKeyClass('9', '(')}>
            <div className="text-xs">(</div>
            <div>9</div>
          </button>
          <button className={getKeyClass('0', ')')}>
            <div className="text-xs">)</div>
            <div>0</div>
          </button>
          <button className={getKeyClass('-', '_')}>
            <div className="text-xs">_</div>
            <div>-</div>
          </button>
          <button className={getKeyClass('=', '+')}>
            <div className="text-xs">+</div>
            <div>=</div>
          </button>
          <button className={getSpecialKeyClass(['Backspace'], true)} disabled={!backspaceEnabled}>Backspace</button>
        </div>

        {/* First Letter Row */}
        <div className="flex justify-center gap-1 mb-1">
          <button className={getSpecialKeyClass(['Tab'])}>Tab</button>
          <button className={getKeyClass('q', 'Q')}>Q</button>
          <button className={getKeyClass('w', 'W')}>W</button>
          <button className={getKeyClass('e', 'E')}>E</button>
          <button className={getKeyClass('r', 'R')}>R</button>
          <button className={getKeyClass('t', 'T')}>T</button>
          <button className={getKeyClass('y', 'Y')}>Y</button>
          <button className={getKeyClass('u', 'U')}>U</button>
          <button className={getKeyClass('i', 'I')}>I</button>
          <button className={getKeyClass('o', 'O')}>O</button>
          <button className={getKeyClass('p', 'P')}>P</button>
          <button className={getKeyClass('[', '{')}>
            <div className="text-xs">{'{'}</div>
            <div>[</div>
          </button>
          <button className={getKeyClass(']', '}')}>
            <div className="text-xs">{'}'}</div>
            <div>]</div>
          </button>
          <button className={getKeyClass('\\', '|')}>
            <div className="text-xs">|</div>
            <div>\</div>
          </button>
        </div>

        {/* Second Letter Row */}
        <div className="flex justify-center gap-1 mb-1">
          <button className={getSpecialKeyClass(['CapsLock'])}>CapsLock</button>
          <button className={getKeyClass('a', 'A')}>A</button>
          <button className={getKeyClass('s', 'S')}>S</button>
          <button className={getKeyClass('d', 'D')}>D</button>
          <button className={getKeyClass('f', 'F')}>F</button>
          <button className={getKeyClass('g', 'G')}>G</button>
          <button className={getKeyClass('h', 'H')}>H</button>
          <button className={getKeyClass('j', 'J')}>J</button>
          <button className={getKeyClass('k', 'K')}>K</button>
          <button className={getKeyClass('l', 'L')}>L</button>
          <button className={getKeyClass(';', ':')}>
            <div className="text-xs">:</div>
            <div>;</div>
          </button>
          <button className={getKeyClass("'", '"')}>
            <div className="text-xs">"</div>
            <div>'</div>
          </button>
          <button className={getSpecialKeyClass(['Enter'])}>Enter</button>
        </div>

        {/* Third Letter Row */}
        <div className="flex justify-center gap-1 mb-1">
          <button className={getSpecialKeyClass(['Shift'])}>Shift</button>
          <button className={getKeyClass('z', 'Z')}>Z</button>
          <button className={getKeyClass('x', 'X')}>X</button>
          <button className={getKeyClass('c', 'C')}>C</button>
          <button className={getKeyClass('v', 'V')}>V</button>
          <button className={getKeyClass('b', 'B')}>B</button>
          <button className={getKeyClass('n', 'N')}>N</button>
          <button className={getKeyClass('m', 'M')}>M</button>
          <button className={getKeyClass(',', '<')}>
            <div className="text-xs">{'<'}</div>
            <div>,</div>
          </button>
          <button className={getKeyClass('.', '>')}>
            <div className="text-xs">{'>'}</div>
            <div>.</div>
          </button>
          <button className={getKeyClass('/', '?')}>
            <div className="text-xs">?</div>
            <div>/</div>
          </button>
          <button className={getSpecialKeyClass(['Shift'])}>Shift</button>
        </div>

        {/* Bottom Row */}
        <div className="flex justify-center gap-1">
          <button className={getSpecialKeyClass(['Control', 'Ctrl'])}>Ctrl</button>
          <button className={getSpecialKeyClass(['Option', 'Alt'])}>Option</button>
          <button className={getKeyClass(' ')} style={{ minWidth: '250px' }}>
            space
          </button>
          <button className={getSpecialKeyClass(['Option', 'Alt'])}>Option</button>
          <button className={getSpecialKeyClass(['Control', 'Ctrl'])}>Ctrl</button>
        </div>
      </div>
    </div>
  );
};
