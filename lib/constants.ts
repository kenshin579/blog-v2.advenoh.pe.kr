/**
 * Application constants
 */

import { ViewportSize } from "@/hooks/use-viewport-size";

export const DEFAULT_ARTICLE_IMAGE = '/images/default/default.png';

export const INITIAL_DISPLAY_COUNT: Record<ViewportSize, number> = {
  mobile: 6,
  tablet: 8,
  desktop: 12,
} as const;
