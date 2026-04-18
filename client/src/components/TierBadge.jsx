import React from 'react';
import { getTier } from '../utils/tiers';

export default function TierBadge({ score }) {
  const tier = getTier(score);
  return (
    <span className="tier-badge" style={{ background: tier.color }}>
      {tier.name}
    </span>
  );
}
