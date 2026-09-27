/* ==========================================================================
   Banned Details Card Component (Forwarding to BannedDetailsGrid)
   Compliance: ISO/IEC 25010, WCAG 2.1 (Accessibility)
========================================================================== */

'use client';

import React from 'react';
import { BannedDetailsGrid } from './BannedDetailsGrid';
import type { BannedDetailsCardProps } from './types';

export function BannedDetailsCard(props: BannedDetailsCardProps) {
  return <BannedDetailsGrid {...props} />;
}

export default BannedDetailsCard;
