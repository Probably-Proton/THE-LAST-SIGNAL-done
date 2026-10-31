/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BACKWARDS-COMPATIBLE ADAPTER FOR AMBIENT AUDIO
 * Delegates to the unified tacticalAudio controller.
 */

import { tacticalAudio } from './tacticalAudio';

export class AmbientAudioAdapter {
  public getIsMuted(): boolean {
    return tacticalAudio.isAmbientMuted();
  }

  public isMuted(): boolean {
    return tacticalAudio.isAmbientMuted();
  }

  public getVolume(): number {
    return tacticalAudio.getAmbientVolume();
  }

  public toggleMute(): Promise<boolean> {
    return tacticalAudio.toggleAmbientMute();
  }

  public setVolume(vol: number): void {
    tacticalAudio.setAmbientVolume(vol);
  }

  public setLocationProfile(profile: import('./tacticalAudio').AudioLocationProfile): void {
    tacticalAudio.setLocationProfile(profile);
  }

  public subscribe(fn: (muted: boolean, volume: number) => void): () => void {
    return tacticalAudio.subscribe((state) => {
      fn(state.ambientMuted, state.ambientVolume);
    });
  }
}

export const ambientAudio = new AmbientAudioAdapter();
