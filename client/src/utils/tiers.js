export const TIERS = [
  { max: -61, name: 'Hostile',    color: '#c0392b', bg: '#fdf0ef' },
  { max: -21, name: 'Unfriendly', color: '#d35400', bg: '#fef5ec' },
  { max:  20, name: 'Neutral',    color: '#7f8c8d', bg: '#f4f6f7' },
  { max:  60, name: 'Friendly',   color: '#27ae60', bg: '#eafaf1' },
  { max:  90, name: 'Honored',    color: '#2980b9', bg: '#ebf5fb' },
  { max: 100, name: 'Exalted',    color: '#8e44ad', bg: '#f5eef8' },
];

export function getTier(score) {
  for (const tier of TIERS) {
    if (score <= tier.max) return tier;
  }
  return TIERS[TIERS.length - 1];
}

export function clampScore(score) {
  return Math.max(-100, Math.min(100, score));
}

export function formatDelta(delta) {
  return delta >= 0 ? `+${delta}` : String(delta);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
