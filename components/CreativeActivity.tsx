'use client';
import { useEffect, useState } from 'react';
import { ThinkingOrb } from 'thinking-orbs';
import styles from './CreativeActivity.module.css';

export function CreativeActivity({ active = true, size = 20 }: { active?: boolean; size?: 20 | 64 }) {
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPaused(motion.matches || document.visibilityState !== 'visible');
    update();
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      motion.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  if (!active) return null;
  return <span className={styles.orb} aria-hidden="true" data-creative-activity="" data-motion={paused ? 'paused' : 'active'}>
    <ThinkingOrb state="connecting" size={size} speed={0.7} theme="dark" paused={paused} aria-hidden="true" />
  </span>;
}
