// App content that is not design tokens. Avatars are platform emoji in v1 (replaced in M3, F-19.AC-5).

/** [avatar, price in gems]. Price 0 means free at sign-up. */
export const AVATARS: [string, number][] = [['🦊', 0], ['🐢', 0], ['🐙', 0], ['🦉', 20], ['🐼', 25], ['🐝', 25], ['🐳', 30], ['🦖', 35], ['🤖', 40], ['🐉', 50], ['🦄', 50], ['🪐', 60]];
export const DEFAULT_AVATAR = '🦊';
export const OK_LINES = ["That's it!", 'Nice thinking.', 'Yes, spot on.', 'You worked it out.', 'Exactly right.', 'Great job.'];
export const STATE_LABEL: Record<string, string> = { lit: 'mastered', now: 'practising now', open: 'ready to start', locked: 'locked' };
/** Gems (spec F-15.AC-2, v1 values). */
export const GEMS = { answer: 1, clean: 1, up: 5, back: 2, mastered: 15, session: 5 };
export const HOLD_MS = 1200;
export const BOOT_MS = 1600;
