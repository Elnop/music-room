import type { CONTENT_MAX_WIDTH } from '@/shared/theme/configs/layoutConfig';

export type ContentWidth = keyof typeof CONTENT_MAX_WIDTH;

export type Breakpoint = 'phone' | 'tablet' | 'desktop';
