/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SIGNAL AUDIO SERVICE & DISPATCH PLAYER CONTROLLER
 * 
 * Dedicated singleton controller for the authentic Stage 4 / EV-0401
 * Signal Room transmission:
 * - Uses the canonical audio asset: /assets/aistudio/f66d7a8e-5f86-4cf5-91a1-7e6852fd72b9_dc54f803.mp3
 *   (with /audio/signal-transmission.mp3 fallback).
 * - Manages HTMLAudioElement lifecycle, volume, mute, seek, speed, and looping.
 * - Prevents multiple audio instances across component re-renders or page navigation.
 * - Seamlessly ducks ambient background audio during transmission playback
 *   and restores ambient levels upon pause, stop, or unmount.
 * - Respects user preferences (localStorage) and browser autoplay policies.
 */

import { tacticalAudio } from './tacticalAudio';

export interface SignalAudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isLooping: boolean;
  isLoaded: boolean;
}

type SignalAudioSubscriber = (state: SignalAudioState) => void;

export const SIGNAL_AUDIO_SRC = '/assets/aistudio/f66d7a8e-5f86-4cf5-91a1-7e6852fd72b9_dc54f803.mp3';
export const SIGNAL_AUDIO_FALLBACK_SRC = '/audio/signal-transmission.mp3';

class SignalAudioService {
  private audio: HTMLAudioElement | null = null;
  private subscribers: Set<SignalAudioSubscriber> = new Set();
  private previousLocationProfile: import('./tacticalAudio').AudioLocationProfile = 'map';

  private state: SignalAudioState = {
    isPlaying: false,
    currentTime: 0,
    duration: 59,
    volume: 0.8,
    isMuted: false,
    playbackRate: 1.0,
    isLooping: false,
    isLoaded: false,
  };

  constructor() {
    this.loadStoredPreferences();
  }

  private loadStoredPreferences() {
    if (typeof window === 'undefined') return;
    try {
      const storedVol = localStorage.getItem('tls_signal_volume');
      if (storedVol !== null) {
        const v = parseFloat(storedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          this.state.volume = v;
        }
      }

      const storedMute = localStorage.getItem('tls_signal_muted');
      if (storedMute !== null) {
        this.state.isMuted = storedMute === 'true';
      }
    } catch {
      // Ignore storage access errors
    }
  }

  private ensureAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;

    if (!this.audio) {
      const el = new Audio();
      el.preload = 'metadata';
      el.src = SIGNAL_AUDIO_SRC;
      el.volume = this.state.isMuted ? 0 : this.state.volume;
      el.playbackRate = this.state.playbackRate;
      el.loop = this.state.isLooping;

      el.addEventListener('loadedmetadata', () => {
        if (!isNaN(el.duration) && el.duration > 0) {
          this.state.duration = el.duration;
          this.state.isLoaded = true;
          this.notify();
        }
      });

      el.addEventListener('timeupdate', () => {
        this.state.currentTime = el.currentTime;
        if (!isNaN(el.duration) && el.duration > 0) {
          this.state.duration = el.duration;
        }
        this.notify();
      });

      el.addEventListener('play', () => {
        this.state.isPlaying = true;
        // Duck ambient audio so spoken monologue is forensically intelligible
        tacticalAudio.setLocationProfile('audio_investigation');
        this.notify();
      });

      el.addEventListener('pause', () => {
        this.state.isPlaying = false;
        tacticalAudio.setLocationProfile(this.previousLocationProfile);
        this.notify();
      });

      el.addEventListener('ended', () => {
        this.state.isPlaying = false;
        this.state.currentTime = 0;
        tacticalAudio.setLocationProfile(this.previousLocationProfile);
        this.notify();
      });

      el.addEventListener('error', () => {
        // Attempt fallback source if main hash asset path fails
        if (el.src !== window.location.origin + SIGNAL_AUDIO_FALLBACK_SRC && !el.src.endsWith(SIGNAL_AUDIO_FALLBACK_SRC)) {
          el.src = SIGNAL_AUDIO_FALLBACK_SRC;
          el.load();
        }
      });

      this.audio = el;
    }

    return this.audio;
  }

  public subscribe(subscriber: SignalAudioSubscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber({ ...this.state });
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notify() {
    const snapshot = { ...this.state };
    this.subscribers.forEach((fn) => fn(snapshot));
  }

  public getState(): SignalAudioState {
    return { ...this.state };
  }

  public async play(contextProfile: import('./tacticalAudio').AudioLocationProfile = 'map'): Promise<boolean> {
    const el = this.ensureAudioElement();
    if (!el) return false;

    this.previousLocationProfile = contextProfile;

    try {
      el.volume = this.state.isMuted ? 0 : this.state.volume;
      el.playbackRate = this.state.playbackRate;
      el.loop = this.state.isLooping;
      await el.play();
      this.state.isPlaying = true;
      this.notify();
      return true;
    } catch {
      this.state.isPlaying = false;
      this.notify();
      return false;
    }
  }

  public pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
    this.state.isPlaying = false;
    tacticalAudio.setLocationProfile(this.previousLocationProfile);
    this.notify();
  }

  public stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    tacticalAudio.setLocationProfile(this.previousLocationProfile);
    this.notify();
  }

  public seek(seconds: number): void {
    const el = this.ensureAudioElement();
    if (!el) return;
    const bounded = Math.max(0, Math.min(seconds, this.state.duration));
    el.currentTime = bounded;
    this.state.currentTime = bounded;
    this.notify();
  }

  public togglePlayPause(contextProfile: import('./tacticalAudio').AudioLocationProfile = 'map'): Promise<boolean> {
    if (this.state.isPlaying) {
      this.pause();
      return Promise.resolve(false);
    } else {
      return this.play(contextProfile);
    }
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(volume, 1));
    this.state.volume = clamped;
    if (this.audio && !this.state.isMuted) {
      this.audio.volume = clamped;
    }
    try {
      localStorage.setItem('tls_signal_volume', String(clamped));
    } catch {
      // Ignore
    }
    this.notify();
  }

  public toggleMute(): void {
    const nextMute = !this.state.isMuted;
    this.state.isMuted = nextMute;
    if (this.audio) {
      this.audio.volume = nextMute ? 0 : this.state.volume;
    }
    try {
      localStorage.setItem('tls_signal_muted', String(nextMute));
    } catch {
      // Ignore
    }
    this.notify();
  }

  public setPlaybackRate(rate: number): void {
    this.state.playbackRate = rate;
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
    this.notify();
  }

  public toggleLoop(): void {
    const nextLoop = !this.state.isLooping;
    this.state.isLooping = nextLoop;
    if (this.audio) {
      this.audio.loop = nextLoop;
    }
    this.notify();
  }

  /**
   * Complete cleanup when unmounting views:
   * guarantees zero leaked audio or persistent playback when navigating away.
   */
  public cleanup(): void {
    if (this.audio && this.state.isPlaying) {
      this.audio.pause();
      this.state.isPlaying = false;
      tacticalAudio.setLocationProfile(this.previousLocationProfile);
      this.notify();
    }
  }
}

export const signalAudio = new SignalAudioService();
