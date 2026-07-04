export const EASE_LUX = [0.22, 1, 0.36, 1] as const;

export const transitionLux = {
  duration: 0.7,
  ease: EASE_LUX,
} as const;

/** Instant transition when user prefers reduced motion. */
export const reducedMotionTransition = {
  duration: 0.01,
  ease: EASE_LUX,
} as const;
