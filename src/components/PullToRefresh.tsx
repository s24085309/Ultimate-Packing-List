import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshApp } from '../lib/pwaUpdate';

const THRESHOLD = 70;

// Walks up from the touched element to find the nearest scrollable ancestor
// (the app's pages manage their own overflow:auto container internally).
function findScrollParent(el: Element | null): HTMLElement | null {
  let node = el as HTMLElement | null;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return (document.scrollingElement as HTMLElement) ?? null;
}

// Pull-down-to-refresh gesture, wired to reload the app and pick up the
// latest deployed version (via pwaUpdate's service-worker update check).
export default function PullToRefresh({ children }: { children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const scrollParent = useRef<HTMLElement | null>(null);
  const pullRef = useRef(0);
  useEffect(() => { pullRef.current = pull; }, [pull]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (refreshing || e.touches.length !== 1) { startY.current = null; return; }
      const parent = findScrollParent(e.target as Element);
      if (parent && parent.scrollTop > 0) { startY.current = null; return; }
      scrollParent.current = parent;
      startY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); return; }
      if (scrollParent.current && scrollParent.current.scrollTop > 0) { startY.current = null; setPull(0); return; }
      setPull(Math.min(dy * 0.5, 100));
      if (dy > 10 && e.cancelable) e.preventDefault();
    };
    const onTouchEnd = () => {
      if (startY.current == null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        refreshApp();
      } else {
        setPull(0);
      }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [refreshing]);

  return (
    <>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: pull, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: refreshing ? 'none' : 'height 0.2s ease', zIndex: 2000, pointerEvents: 'none',
        }}
      >
        {pull > 8 && (
          <RefreshCw
            size={22} color="var(--text-hi)"
            className={refreshing || pull >= THRESHOLD ? 'spin' : ''}
            style={refreshing || pull >= THRESHOLD ? undefined : { transform: `rotate(${pull * 3}deg)` }}
          />
        )}
      </div>
      <div style={{ height: '100%', transform: `translateY(${pull}px)`, transition: refreshing ? 'none' : 'transform 0.2s ease' }}>
        {children}
      </div>
    </>
  );
}
