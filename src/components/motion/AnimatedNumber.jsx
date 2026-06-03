// Count-up number (DESIGN.md §8). Animates 0 → value on first appear, then on value change.
// Reduce-motion → shows the final value immediately. `format` controls display (thousands, $, etc.).
import React, { useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

export default function AnimatedNumber({ value, format = (n) => String(Math.round(n)), duration = 600, style }) {
  const target = Number(value) || 0;
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? target : 0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(target);
      return;
    }
    const from = fromRef.current;
    startRef.current = 0;

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplay(from + (target - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration, reduced]);

  return <Text style={style}>{format(display)}</Text>;
}
