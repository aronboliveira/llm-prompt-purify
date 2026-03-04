/**
 * Type declarations for keyboard shortcuts service
 */

export interface KeyboardShortcut {
  action: () => void;
  alt?: boolean;
  ctrl?: boolean;
  description: string;
  key: string;
  shift?: boolean;
}
