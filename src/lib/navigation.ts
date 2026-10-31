/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { tacticalAudio } from '@/src/lib/tacticalAudio';

export function navigate(path: string): void {
  tacticalAudio.playNavClick();
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
