export const DEMO_SPEED_RATIO = 0.4;

export const demoMs = (durationMs: number) => Math.max(1, Math.round(durationMs * DEMO_SPEED_RATIO));
