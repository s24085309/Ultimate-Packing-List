import { useState } from 'react';
import { X, Delete, Lock } from 'lucide-react';
import Portal from './Portal';

interface Props {
  expected: string;
  title?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PinPrompt({ expected, title = 'Enter PIN', onSuccess, onCancel }: Props) {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);

  const press = (d: string) => {
    const next = (value + d).slice(0, 6);
    setValue(next);
    if (next.length >= expected.length) {
      if (next === expected) {
        onSuccess();
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setValue(''); }, 400);
      }
    }
  };

  return (
    <Portal>
      <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(5,3,10,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onCancel}>
        <div
          className="glass"
          onClick={e => e.stopPropagation()}
          style={{
            width: 340, maxWidth: '100%', padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
            animation: shake ? 'pinShakeX 0.4s' : 'none',
          }}
        >
          <style>{`@keyframes pinShakeX { 0%,100%{transform:translateX(0);} 20%{transform:translateX(-10px);} 40%{transform:translateX(10px);} 60%{transform:translateX(-6px);} 80%{transform:translateX(6px);} }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock size={18} color="var(--accent-3)" />
              <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
            </span>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><X size={20} /></button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {Array.from({ length: expected.length }).map((_, i) => (
              <span key={i} style={{
                width: 16, height: 16, borderRadius: '50%',
                background: i < value.length ? 'var(--grad-a)' : 'rgba(255,255,255,0.12)',
                border: '1px solid var(--card-border)',
              }} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                onClick={() => press(d)}
                style={{
                  minHeight: 58, borderRadius: 14, border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text-hi)', fontSize: 20, fontWeight: 700,
                }}
              >{d}</button>
            ))}
            <span />
            <button
              onClick={() => press('0')}
              style={{
                minHeight: 58, borderRadius: 14, border: '1px solid var(--card-border)',
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-hi)', fontSize: 20, fontWeight: 700,
              }}
            >0</button>
            <button
              onClick={() => setValue(v => v.slice(0, -1))}
              style={{
                minHeight: 58, borderRadius: 14, border: '1px solid var(--card-border)',
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-lo)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            ><Delete size={20} /></button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
