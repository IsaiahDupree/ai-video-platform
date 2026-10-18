// Custom easing functions beyond Remotion's built-in ones

// Sine easings
export function easeInSine(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2);
}

export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// Exponential easings
export function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

// Elastic easings
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeInElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
}

// Back easings (overshoot)
export function easeInBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOutBack(t: number): number {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  if (t < 0.5) {
    return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
  }
  return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

// Bounce easing
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

export function easeInBounce(t: number): number {
  return 1 - easeOutBounce(1 - t);
}

// Spring easing (physically-based)
export function spring(
  t: number,
  mass: number = 1,
  stiffness: number = 100,
  damping: number = 10
): number {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  
  if (zeta < 1) {
    // Underdamped
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
  } else {
    // Critically damped or overdamped
    return 1 - (1 + w0 * t) * Math.exp(-w0 * t);
  }
}

// Create custom bezier easing
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): (t: number) => number {
  return (t: number): number => {
    // Simplified cubic bezier approximation
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    
    const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
    
    // Newton-Raphson iteration to find t for x
    let x = t;
    for (let i = 0; i < 8; i++) {
      const currentX = sampleCurveX(x) - t;
      if (Math.abs(currentX) < 0.0001) break;
      const dx = (3 * ax * x + 2 * bx) * x + cx;
      if (Math.abs(dx) < 0.0001) break;
      x -= currentX / dx;
    }
    
    return sampleCurveY(x);
  };
}
