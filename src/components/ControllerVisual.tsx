import { GAMEPAD_BUTTON_NAMES } from '@/lib/constants';
import { classNames } from '@/lib/utils';

interface ControllerVisualProps {
  pressedButtons: Set<string>;
  stickPositions: { left: { x: number; y: number }; right: { x: number; y: number } };
  triggerValues: { lt: number; rt: number };
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export function ControllerVisual({
  pressedButtons,
  stickPositions,
  triggerValues,
  size = 'md',
}: ControllerVisualProps) {
  const dims = {
    sm: { w: 280, h: 180 },
    md: { w: 440, h: 280 },
    lg: { w: 560, h: 360 },
  };
  const { w, h } = dims[size];

  function isPressed(name: string) {
    return pressedButtons.has(name);
  }

  return (
    <div className="flex items-center justify-center" role="img" aria-label="Interactive game controller visualization">
      <svg viewBox="0 0 440 280" width={w} height={h} className="max-w-full h-auto" style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))' }}>
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1e2e" />
            <stop offset="100%" stopColor="#0f0f18" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Controller body */}
        <path
          d="M 80 100 Q 50 100 40 140 Q 30 200 70 240 Q 120 260 160 240 Q 180 220 200 220 L 240 220 Q 260 220 280 240 Q 320 260 370 240 Q 410 200 400 140 Q 390 100 360 100 L 280 100 Q 260 110 220 110 L 180 110 Q 140 110 120 100 Z"
          fill="url(#bodyGrad)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />

        {/* Accent line */}
        <path
          d="M 120 100 Q 140 110 180 110 L 220 110 Q 260 110 280 100"
          fill="none"
          stroke="url(#accentGrad)"
          strokeWidth="2"
          opacity="0.5"
        />

        {/* Left stick */}
        <g transform={`translate(100, 160)`}>
          <circle cx="0" cy="0" r="28" fill="#0a0a12" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="0" cy="0" r="24" fill="#1a1a28" />
          <circle
            cx={stickPositions.left.x * 16}
            cy={stickPositions.left.y * 16}
            r="16"
            fill={isPressed('L3') ? 'var(--accent)' : '#2a2a3a'}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            className="transition-all duration-75"
            filter={isPressed('L3') ? 'url(#glow)' : undefined}
          />
          <text x="0" y="40" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="monospace">L STICK</text>
        </g>

        {/* Right stick */}
        <g transform={`translate(290, 180)`}>
          <circle cx="0" cy="0" r="28" fill="#0a0a12" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="0" cy="0" r="24" fill="#1a1a28" />
          <circle
            cx={stickPositions.right.x * 16}
            cy={stickPositions.right.y * 16}
            r="16"
            fill={isPressed('R3') ? 'var(--accent)' : '#2a2a3a'}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            className="transition-all duration-75"
            filter={isPressed('R3') ? 'url(#glow)' : undefined}
          />
          <text x="0" y="40" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="monospace">R STICK</text>
        </g>

        {/* D-Pad */}
        <g transform="translate(175, 170)">
          {/* Up */}
          <rect x="-8" y="-30" width="16" height="20" rx="3"
            fill={isPressed('D-Up') ? 'var(--accent)' : '#222232'}
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
            filter={isPressed('D-Up') ? 'url(#glow)' : undefined}
            className="transition-all duration-100" />
          {/* Down */}
          <rect x="-8" y="10" width="16" height="20" rx="3"
            fill={isPressed('D-Down') ? 'var(--accent)' : '#222232'}
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
            filter={isPressed('D-Down') ? 'url(#glow)' : undefined}
            className="transition-all duration-100" />
          {/* Left */}
          <rect x="-30" y="-8" width="20" height="16" rx="3"
            fill={isPressed('D-Left') ? 'var(--accent)' : '#222232'}
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
            filter={isPressed('D-Left') ? 'url(#glow)' : undefined}
            className="transition-all duration-100" />
          {/* Right */}
          <rect x="10" y="-8" width="20" height="16" rx="3"
            fill={isPressed('D-Right') ? 'var(--accent)' : '#222232'}
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
            filter={isPressed('D-Right') ? 'url(#glow)' : undefined}
            className="transition-all duration-100" />
          {/* Center */}
          <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#1a1a28" />
        </g>

        {/* Face buttons (ABXY) */}
        <g transform="translate(345, 155)">
          {/* Y (top) */}
          <circle cx="0" cy="-22" r="14"
            fill={isPressed('Y') ? '#ff9c00' : '#1a1a26'}
            stroke={isPressed('Y') ? '#ff9c00' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1"
            filter={isPressed('Y') ? 'url(#glow)' : undefined}
            className="transition-all duration-100" />
          <text x="0" y="-18" textAnchor="middle" fontSize="12" fontWeight="bold" fill={isPressed('Y') ? '#000' : 'rgba(255,255,255,0.6)'} fontFamily="monospace">Y</text>

          {/* X (left) */}
          <circle cx="-22" cy="0" r="14"
            fill={isPressed('X') ? '#3b82f6' : '#1a1a26'}
            stroke={isPressed('X') ? '#3b82f6' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1"
            filter={isPressed('X') ? 'url(#glow)' : undefined}
            className="transition-all duration-100" />
          <text x="-22" y="4" textAnchor="middle" fontSize="12" fontWeight="bold" fill={isPressed('X') ? '#fff' : 'rgba(255,255,255,0.6)'} fontFamily="monospace">X</text>

          {/* B (right) */}
          <circle cx="22" cy="0" r="14"
            fill={isPressed('B') ? '#ff4757' : '#1a1a26'}
            stroke={isPressed('B') ? '#ff4757' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1"
            filter={isPressed('B') ? 'url(#glow)' : undefined}
            className="transition-all duration-100" />
          <text x="22" y="4" textAnchor="middle" fontSize="12" fontWeight="bold" fill={isPressed('B') ? '#fff' : 'rgba(255,255,255,0.6)'} fontFamily="monospace">B</text>

          {/* A (bottom) */}
          <circle cx="0" cy="22" r="14"
            fill={isPressed('A') ? '#00ff88' : '#1a1a26'}
            stroke={isPressed('A') ? '#00ff88' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1"
            filter={isPressed('A') ? 'url(#glow)' : undefined}
            className="transition-all duration-100" />
          <text x="0" y="26" textAnchor="middle" fontSize="12" fontWeight="bold" fill={isPressed('A') ? '#000' : 'rgba(255,255,255,0.6)'} fontFamily="monospace">A</text>
        </g>

        {/* LB / RB */}
        <rect x="80" y="75" width="50" height="12" rx="6"
          fill={isPressed('LB') ? 'var(--accent)' : '#222232'}
          stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
          filter={isPressed('LB') ? 'url(#glow)' : undefined}
          className="transition-all duration-100" />
        <text x="105" y="84" textAnchor="middle" fontSize="8" fill={isPressed('LB') ? '#000' : 'rgba(255,255,255,0.4)'} fontWeight="bold" fontFamily="monospace">LB</text>

        <rect x="310" y="75" width="50" height="12" rx="6"
          fill={isPressed('RB') ? 'var(--accent)' : '#222232'}
          stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
          filter={isPressed('RB') ? 'url(#glow)' : undefined}
          className="transition-all duration-100" />
        <text x="335" y="84" textAnchor="middle" fontSize="8" fill={isPressed('RB') ? '#000' : 'rgba(255,255,255,0.4)'} fontWeight="bold" fontFamily="monospace">RB</text>

        {/* LT / RT (triggers - show fill level) */}
        <rect x="80" y="55" width="50" height="14" rx="6" fill="#0a0a12" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <rect x="82" y="57" width={46 * triggerValues.lt} height="10" rx="4" fill="var(--accent)" className="transition-all duration-75" style={{ filter: triggerValues.lt > 0.1 ? 'url(#glow)' : 'none' }} opacity={0.3 + triggerValues.lt * 0.7} />
        <text x="105" y="64" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)" fontWeight="bold" fontFamily="monospace" style={{ mixBlendMode: 'difference' }}>LT</text>

        <rect x="310" y="55" width="50" height="14" rx="6" fill="#0a0a12" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <rect x="312" y="57" width={46 * triggerValues.rt} height="10" rx="4" fill="var(--accent)" className="transition-all duration-75" style={{ filter: triggerValues.rt > 0.1 ? 'url(#glow)' : 'none' }} opacity={0.3 + triggerValues.rt * 0.7} />
        <text x="335" y="64" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)" fontWeight="bold" fontFamily="monospace" style={{ mixBlendMode: 'difference' }}>RT</text>

        {/* Select / Start */}
        <ellipse cx="180" cy="120" rx="7" ry="4"
          fill={isPressed('Select') ? 'var(--accent)' : '#222232'}
          stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
          filter={isPressed('Select') ? 'url(#glow)' : undefined}
          className="transition-all duration-100" />
        <ellipse cx="260" cy="120" rx="7" ry="4"
          fill={isPressed('Start') ? 'var(--accent)' : '#222232'}
          stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
          filter={isPressed('Start') ? 'url(#glow)' : undefined}
          className="transition-all duration-100" />

        {/* Home button */}
        <circle cx="220" cy="140" r="8"
          fill={isPressed('Home') ? 'var(--accent)' : '#1a1a26'}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          filter={isPressed('Home') ? 'url(#glow)' : undefined}
          className="transition-all duration-100" />
        <circle cx="220" cy="140" r="3" fill="rgba(255,255,255,0.2)" />
      </svg>
    </div>
  );
}
