import { useState, useEffect, useRef, useCallback } from 'react';

const GAME_W = 895;
const GAME_H = 503;

const LEVELS = [
  { id: 1,  x: 115, y: 385, phrase: "hola mundo" },
  { id: 2,  x: 115, y: 262, phrase: "la vida es bella" },
  { id: 3,  x: 198, y: 200, phrase: "el sol brilla" },
  { id: 4,  x: 308, y: 178, phrase: "amor y paz" },
  { id: 5,  x: 392, y: 194, phrase: "sigue adelante" },
  { id: 6,  x: 456, y: 218, phrase: "nunca te rindas" },
  { id: 7,  x: 528, y: 268, phrase: "todo es posible" },
  { id: 8,  x: 524, y: 344, phrase: "crece cada dia" },
  { id: 9,  x: 594, y: 328, phrase: "aprende y vive" },
  { id: 10, x: 664, y: 192, phrase: "eres una campeona" },
];

const CONFETTI_COLORS = [
  '#FF6B6B','#FFE66D','#4ECDC4','#45B7D1',
  '#96CEB4','#F8B4A0','#A8E6CF','#FFD93D',
  '#FF9FF3','#54A0FF',
];

interface ConfettiParticle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  isCircle: boolean;
}

export default function App() {
  const [princessNode, setPrincessNode] = useState(0);
  const [highestCompleted, setHighestCompleted] = useState(-1);
  const [showDialog, setShowDialog] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [showCongrats, setShowCongrats] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<ConfettiParticle[]>([]);
  const rafRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLevel = LEVELS[princessNode];

  const stopConfetti = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, GAME_W, GAME_H);
    }
    confettiRef.current = [];
  }, []);

  const launchConfetti = useCallback(() => {
    stopConfetti();
    confettiRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * GAME_W,
      y: -10 - Math.random() * 60,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 5 + 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 10 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      isCircle: Math.random() > 0.5,
    }));

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, GAME_W, GAME_H);
      confettiRef.current = confettiRef.current.filter(p => p.y < GAME_H + 30);

      confettiRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.92;

        if (p.isCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
        }
        ctx.restore();
      });

      if (confettiRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, GAME_W, GAME_H);
      }
    };

    rafRef.current = requestAnimationFrame(draw);
  }, [stopConfetti]);

  useEffect(() => {
    if (showDialog) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [showDialog]);

  const handleSubmit = useCallback(() => {
    const phrase = LEVELS[princessNode].phrase;
    if (inputValue.trim().toLowerCase() === phrase.toLowerCase()) {
      setShowDialog(false);
      setInputValue('');
      setInputError('');

      const newHighest = princessNode;
      setHighestCompleted(newHighest);
      setShowCongrats(true);
      launchConfetti();

      if (newHighest === LEVELS.length - 1) {
        setTimeout(() => {
          setShowCongrats(false);
          stopConfetti();
          setGameComplete(true);
        }, 4500);
      } else {
        setTimeout(() => {
          setShowCongrats(false);
          stopConfetti();
        }, 3500);
      }
    } else {
      setInputError('Frase incorrecta. ¡Intenta de nuevo!');
    }
  }, [princessNode, inputValue, launchConfetti, stopConfetti]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameComplete) return;

      if (showDialog) {
        if (e.key === 'Escape') {
          setShowDialog(false);
          setInputValue('');
          setInputError('');
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (princessNode <= highestCompleted && princessNode < LEVELS.length - 1) {
          const next = princessNode + 1;
          setPrincessNode(next);
          if (next > highestCompleted) {
            setTimeout(() => setShowDialog(true), 380);
          }
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (princessNode > 0) {
          setPrincessNode(prev => prev - 1);
        }
      } else if (e.key === 'Enter') {
        if (princessNode > highestCompleted) {
          setShowDialog(true);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDialog, princessNode, highestCompleted, gameComplete]);

  const resetGame = () => {
    stopConfetti();
    setPrincessNode(0);
    setHighestCompleted(-1);
    setGameComplete(false);
    setShowDialog(true);
    setInputValue('');
    setInputError('');
    setShowCongrats(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a4a3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: GAME_W, height: GAME_H, borderRadius: 4, overflow: 'hidden', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>

        {/* Background map */}
        <img
          src="/MYzE1j.png"
          alt="Overworld Map"
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated', userSelect: 'none' }}
        />

        {/* Path connections */}
        <svg style={{ position: 'absolute', inset: 0, zIndex: 5 }} width={GAME_W} height={GAME_H}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {LEVELS.map((level, i) => {
            if (i === 0) return null;
            const prev = LEVELS[i - 1];
            const done = i - 1 <= highestCompleted;
            return (
              <line
                key={i}
                x1={prev.x} y1={prev.y}
                x2={level.x} y2={level.y}
                stroke={done ? 'rgba(255,215,0,0.75)' : 'rgba(200,200,200,0.3)'}
                strokeWidth={done ? 4 : 3}
                strokeDasharray={done ? 'none' : '7,5'}
                filter={done ? 'url(#glow)' : 'none'}
              />
            );
          })}
        </svg>

        {/* Level nodes */}
        {LEVELS.map((level, i) => {
          const completed = i <= highestCompleted;
          const isNext = i === highestCompleted + 1;
          const isCurrent = i === princessNode;

          const bg = completed
            ? 'linear-gradient(135deg,#FFD700,#f0a800)'
            : isNext
            ? 'linear-gradient(135deg,#4ade80,#16a34a)'
            : 'linear-gradient(135deg,#6b7280,#4b5563)';
          const textColor = completed ? '#7a5000' : isNext ? '#052e16' : '#e5e7eb';
          const borderColor = completed ? '#c89000' : isNext ? '#14532d' : '#374151';

          return (
            <div
              key={level.id}
              style={{
                position: 'absolute',
                left: level.x - 20,
                top: level.y - 20,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 15,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: bg,
                  border: `3px solid ${borderColor}`,
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 900,
                  fontFamily: 'system-ui, sans-serif',
                  boxShadow: isCurrent
                    ? '0 0 0 3px #fff, 0 0 20px rgba(255,255,100,1)'
                    : '0 2px 6px rgba(0,0,0,0.6)',
                  transform: isCurrent ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  userSelect: 'none',
                }}
              >
                {completed ? '★' : level.id}
              </div>
            </div>
          );
        })}

        {/* Princess sprite */}
        <img
          src="/Peach-Sprite.png"
          alt="Princess Peach"
          draggable={false}
          style={{
            position: 'absolute',
            left: currentLevel.x - 20,
            top: currentLevel.y - 52,
            width: 40,
            height: 58,
            imageRendering: 'pixelated',
            zIndex: 20,
            transition: 'left 0.35s cubic-bezier(0.4,0,0.2,1), top 0.35s cubic-bezier(0.4,0,0.2,1)',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
            userSelect: 'none',
          }}
        />

        {/* Confetti canvas */}
        <canvas
          ref={canvasRef}
          width={GAME_W}
          height={GAME_H}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 45 }}
        />

        {/* Congratulations banner */}
        {showCongrats && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 46,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
                borderRadius: 20,
                padding: '24px 48px',
                border: '2px solid rgba(255,215,0,0.4)',
              }}
            >
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  fontFamily: 'system-ui, sans-serif',
                  color: '#FFD700',
                  textShadow: '3px 3px 0 #7a5000, -1px -1px 0 #7a5000',
                  lineHeight: 1.1,
                  letterSpacing: 1,
                }}
              >
                FELICITACIONES!
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: 'system-ui, sans-serif',
                  color: '#fff',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  marginTop: 10,
                }}
              >
                {princessNode < LEVELS.length - 1
                  ? `Nivel ${princessNode + 1} superado!`
                  : 'Todos los niveles completados!'}
              </div>
            </div>
          </div>
        )}

        {/* Dialog */}
        {showDialog && !gameComplete && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              background: 'rgba(0,0,0,0.58)',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(160deg,#fffbe6 0%,#fff5cc 100%)',
                borderRadius: 22,
                padding: '30px 34px',
                width: 400,
                boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 0 0 4px #FFD700, 0 0 0 7px rgba(255,215,0,0.3)',
                border: '2px solid #e8b000',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#FFD700,#f0a800)',
                    border: '2px solid #c89000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 900,
                    color: '#7a5000',
                    fontFamily: 'system-ui, sans-serif',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(200,144,0,0.4)',
                  }}
                >
                  {currentLevel.id}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b08000', fontFamily: 'system-ui, sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
                    Nivel {currentLevel.id} de 10
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#6b4200', fontFamily: 'system-ui, sans-serif', lineHeight: 1.2 }}>
                    Frase Secreta
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#e8c050,transparent)', marginBottom: 16 }} />

              <p style={{ color: '#5a4000', fontWeight: 600, marginBottom: 16, fontSize: 14, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
                Cual es la frase secreta de este nivel? Escribela correctamente para continuar.
              </p>

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setInputError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="Escribe la frase secreta..."
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 11,
                  border: inputError ? '2px solid #ef4444' : '2px solid #d4a800',
                  fontSize: 14,
                  outline: 'none',
                  color: '#333',
                  background: '#fff',
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, sans-serif',
                  boxShadow: inputError ? '0 0 0 3px rgba(239,68,68,0.2)' : '0 0 0 3px rgba(255,215,0,0.15)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />

              {inputError && (
                <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8, marginBottom: 0, fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
                  {inputError}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => { setShowDialog(false); setInputValue(''); setInputError(''); }}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 11,
                    border: '2px solid #cbb870',
                    background: '#fff',
                    color: '#7a6000',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 11,
                    border: '2px solid #b08800',
                    background: 'linear-gradient(135deg,#FFD700,#f0a800)',
                    color: '#6b4200',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontFamily: 'system-ui, sans-serif',
                    boxShadow: '0 4px 14px rgba(240,168,0,0.45)',
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Complete screen */}
        {gameComplete && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 60,
              background: 'rgba(0,0,15,0.92)',
            }}
          >
            <div style={{ textAlign: 'center', padding: '0 32px' }}>
              <img
                src="/Peach-Sprite.png"
                alt="Princess"
                style={{ width: 90, margin: '0 auto 20px', display: 'block', imageRendering: 'pixelated' }}
              />
              <div
                style={{
                  fontSize: 68,
                  fontWeight: 900,
                  fontFamily: 'system-ui, sans-serif',
                  color: '#FFD700',
                  textShadow: '4px 4px 0 #7a5000, -2px -2px 0 #7a5000',
                  lineHeight: 1,
                  letterSpacing: 2,
                }}
              >
                GANASTE!
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: '#fff',
                  fontWeight: 700,
                  fontFamily: 'system-ui, sans-serif',
                  marginTop: 16,
                  textShadow: '2px 2px 6px rgba(0,0,0,0.8)',
                }}
              >
                Has completado los 10 niveles!
              </div>
              <div style={{ fontSize: 16, color: '#FFD700', marginTop: 8, fontFamily: 'system-ui, sans-serif', opacity: 0.9 }}>
                La princesa ha salvado el reino
              </div>
              <button
                onClick={resetGame}
                style={{
                  marginTop: 28,
                  padding: '15px 40px',
                  background: 'linear-gradient(135deg,#FFD700,#f0a800)',
                  border: '3px solid #b08800',
                  borderRadius: 14,
                  color: '#6b4200',
                  fontWeight: 900,
                  fontSize: 18,
                  fontFamily: 'system-ui, sans-serif',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(240,168,0,0.5)',
                  letterSpacing: 0.5,
                }}
              >
                Jugar de nuevo
              </button>
            </div>
          </div>
        )}

        {/* HUD */}
        {!gameComplete && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.65)',
              color: '#e5e7eb',
              fontSize: 11,
              padding: '5px 16px',
              borderRadius: 30,
              zIndex: 25,
              backdropFilter: 'blur(6px)',
              fontWeight: 500,
              fontFamily: 'system-ui, sans-serif',
              whiteSpace: 'nowrap',
              letterSpacing: 0.3,
            }}
          >
            Nivel {princessNode + 1} / 10 &nbsp;•&nbsp; Flechas del teclado para moverte &nbsp;•&nbsp; Enter para abrir el nivel
          </div>
        )}
      </div>
    </div>
  );
}
