import React from 'react';
import { getTier, clampScore } from '../utils/tiers';

export default function ReputationBar({ score, showScore = true }) {
  const clamped = clampScore(score);
  const tier = getTier(clamped);

  // Bar fills from center (50%) outward
  const pct = Math.abs(clamped) / 100; // 0..1
  const width = `${pct * 50}%`;
  const left = clamped >= 0 ? '50%' : `${50 - pct * 50}%`;

  return (
    <div className="rep-bar-wrap">
      <div className="rep-bar-track">
        <div
          className="rep-bar-fill"
          style={{ width, left, background: tier.color }}
        />
        <div className="rep-bar-zero" />
      </div>
      {showScore && (
        <div className="rep-bar-score" style={{ color: tier.color }}>
          {clamped > 0 ? '+' : ''}{clamped}
        </div>
      )}
    </div>
  );
}
