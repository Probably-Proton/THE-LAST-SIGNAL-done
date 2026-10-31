/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TACTICAL INTERFACE & AMBIENT AUDIO SYSTEM
 * 
 * Inspired by the dry, restrained, mechanical interface sounds of classic
 * tactical games (such as Project IGI). Pure Web Audio API synthesis:
 * - Zero external media files or 404 network assets
 * - Procedural mechanical relay clicks, microswitch clicks, paper rustle,
 *   crisp evidence selection, teletype keystrokes, authentic confirmation
 *   chimes, and dull error buzzes.
 * - Independent SFX and Ambience channels with separate volume and mute controls.
 * - Defaults BOTH categories to MUTED until explicitly enabled by the user.
 * - Persisted across page reloads and route changes via localStorage.
 * - No hover sounds. Cooldown protection against double-triggering.
 */

export type AudioLocationProfile =
  | 'dashboard'
  | 'archive'
  | 'map'
  | 'document_viewer'
  | 'audio_investigation'
  | 'messages'
  | 'final_investigation'
  | 'ending'
  | 'silent';

export interface TacticalAudioState {
  sfxMuted: boolean;
  sfxVolume: number;
  ambientMuted: boolean;
  ambientVolume: number;
  rainMuted: boolean;
  rainVolume: number;
  locationProfile: AudioLocationProfile;
}

type AudioStateSubscriber = (state: TacticalAudioState) => void;

class TacticalAudioController {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private windGain: GainNode | null = null;
  private staticGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private rainSource: AudioNode | null = null;
  private roomToneGain: GainNode | null = null;
  private carrierGain: GainNode | null = null;
  private subDroneGain: GainNode | null = null;

  private sfxMuted = true;
  private sfxVolume = 0.25;
  private ambientMuted = true;
  private ambientVolume = 0.18;
  private rainMuted = true;
  private rainVolume = 0.15;
  private locationProfile: AudioLocationProfile = 'dashboard';

  private isInitialized = false;
  private lastNavClickTime = 0;
  private lastBtnClickTime = 0;
  private lastKeypressTime = 0;
  private lastGlitchTime = 0;
  private activeGlitchNodes: Array<{ stop: () => void }> = [];

  private subscribers: Set<AudioStateSubscriber> = new Set();

  constructor() {
    this.loadPreferences();

    // Auto-suspend when document is hidden to conserve resources
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.suspendContext();
        } else if (!this.ambientMuted) {
          this.resumeContext();
        }
      });
    }
  }

  private loadPreferences() {
    try {
      const storedSfxMute = localStorage.getItem('tls_sfx_muted_v1');
      if (storedSfxMute !== null) {
        this.sfxMuted = storedSfxMute === 'true';
      } else {
        this.sfxMuted = true; // Default muted
      }

      const storedSfxVol = localStorage.getItem('tls_sfx_volume_v1');
      if (storedSfxVol !== null) {
        const v = parseFloat(storedSfxVol);
        if (!isNaN(v) && v >= 0 && v <= 1) this.sfxVolume = v;
      }

      const storedAmbMute = localStorage.getItem('tls_ambient_muted_v1') ?? localStorage.getItem('tls_audio_muted_v1');
      if (storedAmbMute !== null) {
        this.ambientMuted = storedAmbMute === 'true';
      } else {
        this.ambientMuted = true; // Default muted
      }

      const storedAmbVol = localStorage.getItem('tls_ambient_volume_v1') ?? localStorage.getItem('tls_audio_volume_v1');
      if (storedAmbVol !== null) {
        const v = parseFloat(storedAmbVol);
        if (!isNaN(v) && v >= 0 && v <= 1) this.ambientVolume = v;
      }

      const storedRainMute = localStorage.getItem('tls_rain_muted_v1');
      if (storedRainMute !== null) {
        this.rainMuted = storedRainMute === 'true';
      } else {
        this.rainMuted = true; // Default muted
      }

      const storedRainVol = localStorage.getItem('tls_rain_volume_v1');
      if (storedRainVol !== null) {
        const v = parseFloat(storedRainVol);
        if (!isNaN(v) && v >= 0 && v <= 1) this.rainVolume = v;
      }
    } catch {
      // localStorage unavailable fallback
    }
  }

  private initAudio() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Channel Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambient Channel Gain
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientMuted ? 0 : this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // --- Wind Synthesizer (Resonant Low-Pass Filtered Pink Noise + LFO) ---
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const windSource = this.ctx.createBufferSource();
      windSource.buffer = noiseBuffer;
      windSource.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
      windFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec gust
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
      lfo.start();

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      windSource.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.ambientGain);
      windSource.start();

      // --- Static Crackle Synthesizer (Band-pass noise) ---
      const staticBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const staticData = staticBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        staticData[i] = (Math.random() * 2 - 1) * 0.04;
      }

      const staticSource = this.ctx.createBufferSource();
      staticSource.buffer = staticBuffer;
      staticSource.loop = true;

      const staticFilter = this.ctx.createBiquadFilter();
      staticFilter.type = 'bandpass';
      staticFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
      staticFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.staticGain = this.ctx.createGain();
      this.staticGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      staticSource.connect(staticFilter);
      staticFilter.connect(this.staticGain);
      this.staticGain.connect(this.ambientGain);
      staticSource.start();

      // --- Procedural Rain Synthesizer (Atmospheric low-end rainfall + soft droplet wash) ---
      const rainBuffer = this.ctx.createBuffer(1, bufferSize * 2, this.ctx.sampleRate);
      const rainData = rainBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize * 2; i++) {
        // Soft pink noise base with occasional droplet density
        const n = Math.random() * 2 - 1;
        rainData[i] = n * 0.08;
      }

      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(1150, this.ctx.currentTime);
      rainFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(this.rainMuted ? 0 : this.rainVolume, this.ctx.currentTime);

      rainSource.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ambientGain);
      rainSource.start();
      this.rainSource = rainSource;

      // --- Room Tone Synthesizer (52Hz low-pass filtered brown noise / archival ventilation) ---
      const roomBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const roomData = roomBuffer.getChannelData(0);
      let rb = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        rb = (rb + (0.02 * white)) / 1.02;
        roomData[i] = rb * 1.8;
      }
      const roomSource = this.ctx.createBufferSource();
      roomSource.buffer = roomBuffer;
      roomSource.loop = true;

      const roomFilter = this.ctx.createBiquadFilter();
      roomFilter.type = 'lowpass';
      roomFilter.frequency.setValueAtTime(95, this.ctx.currentTime);
      roomFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.roomToneGain = this.ctx.createGain();
      this.roomToneGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      roomSource.connect(roomFilter);
      roomFilter.connect(this.roomToneGain);
      this.roomToneGain.connect(this.ambientGain);
      roomSource.start();

      // --- Carrier Transmission Drift Synthesizer (Radio Shortwave Tuning) ---
      const carrierOsc = this.ctx.createOscillator();
      carrierOsc.type = 'sine';
      carrierOsc.frequency.setValueAtTime(1420, this.ctx.currentTime);

      const carrierLfo = this.ctx.createOscillator();
      carrierLfo.frequency.setValueAtTime(0.28, this.ctx.currentTime); // ~3.5s drift
      const carrierLfoGain = this.ctx.createGain();
      carrierLfoGain.gain.setValueAtTime(18, this.ctx.currentTime);
      carrierLfo.connect(carrierLfoGain);
      carrierLfoGain.connect(carrierOsc.frequency);
      carrierLfo.start();

      const carrierFilter = this.ctx.createBiquadFilter();
      carrierFilter.type = 'bandpass';
      carrierFilter.frequency.setValueAtTime(1420, this.ctx.currentTime);
      carrierFilter.Q.setValueAtTime(6.0, this.ctx.currentTime);

      this.carrierGain = this.ctx.createGain();
      this.carrierGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      carrierOsc.connect(carrierFilter);
      carrierFilter.connect(this.carrierGain);
      this.carrierGain.connect(this.ambientGain);
      carrierOsc.start();

      // --- Sub-Drone Tension Synthesizer (44Hz / 88Hz Subterranean Archive Tension) ---
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(44, this.ctx.currentTime);

      const subFilter = this.ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(75, this.ctx.currentTime);

      this.subDroneGain = this.ctx.createGain();
      this.subDroneGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      subOsc.connect(subFilter);
      subFilter.connect(this.subDroneGain);
      this.subDroneGain.connect(this.ambientGain);
      subOsc.start();

      this.isInitialized = true;
      this.applyLocationProfileRamps(this.locationProfile, 0.05);
    } catch (e) {
      console.warn('Tactical Audio failed initialization:', e);
    }
  }

  private async resumeContext() {
    if (!this.isInitialized) {
      this.initAudio();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Handled
      }
    }
  }

  private suspendContext() {
    if (this.ctx && this.ctx.state === 'running') {
      try {
        this.ctx.suspend();
      } catch {
        // Handled
      }
    }
  }

  /* =========================================================================
     LOCATION-BASED AMBIENT AUDIO PROFILE CONTROLLER
     ========================================================================= */

  public getLocationProfile(): AudioLocationProfile {
    return this.locationProfile;
  }

  public setLocationProfile(profile: AudioLocationProfile, rampSec = 0.8): void {
    if (this.locationProfile === profile && this.isInitialized) return;
    this.locationProfile = profile;
    if (this.isInitialized) {
      this.applyLocationProfileRamps(profile, rampSec);
    }
    this.notify();
  }

  private applyLocationProfileRamps(profile: AudioLocationProfile, rampSec = 0.8): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const targetTime = now + Math.max(0.05, rampSec);

    let targetWind = 0.0;
    let targetStatic = 0.0;
    let targetRain = 0.0;
    let targetRoomTone = 0.0;
    let targetCarrier = 0.0;
    let targetSubDrone = 0.0;

    switch (profile) {
      case 'dashboard':
        // Very subtle room tone or electrical ambience, minimal noise
        targetWind = 0.15;
        targetStatic = 0.03;
        targetRain = 0.0;
        targetRoomTone = 0.35;
        targetCarrier = 0.0;
        targetSubDrone = 0.0;
        break;

      case 'archive':
        // Quiet ventilation or distant rain, archival document atmosphere
        targetWind = 0.30;
        targetStatic = 0.05;
        targetRain = this.rainMuted ? 0.0 : this.rainVolume;
        targetRoomTone = 0.20;
        targetCarrier = 0.0;
        targetSubDrone = 0.10;
        break;

      case 'map':
        // Quiet radio static and atmospheric surveillance room tone; zero high-frequency whistling
        targetWind = 0.10;
        targetStatic = 0.12;
        targetRain = 0.0;
        targetRoomTone = 0.15;
        targetCarrier = 0.0;
        targetSubDrone = 0.06;
        break;

      case 'document_viewer':
        // Nearly silent atmosphere, zero distractions from reading
        targetWind = 0.05;
        targetStatic = 0.01;
        targetRain = 0.0;
        targetRoomTone = 0.08;
        targetCarrier = 0.0;
        targetSubDrone = 0.0;
        break;

      case 'audio_investigation':
        // Dip all ambient audio so puzzle cassette can be analyzed with forensic clarity
        targetWind = 0.0;
        targetStatic = 0.0;
        targetRain = 0.0;
        targetRoomTone = 0.0;
        targetCarrier = 0.0;
        targetSubDrone = 0.0;
        break;

      case 'messages':
        // Parent terminal atmosphere, subtle room hum
        targetWind = 0.15;
        targetStatic = 0.04;
        targetRain = 0.0;
        targetRoomTone = 0.25;
        targetCarrier = 0.0;
        targetSubDrone = 0.0;
        break;

      case 'final_investigation':
        // Deeper, restrained atmospheric profile with tension sub-drone
        targetWind = 0.40;
        targetStatic = 0.08;
        targetRain = this.rainMuted ? 0.0 : 0.12;
        targetRoomTone = 0.20;
        targetCarrier = 0.0;
        targetSubDrone = 0.45;
        break;

      case 'ending':
        // Ending video original soundtrack takes absolute priority: fade out all ambience!
        targetWind = 0.0;
        targetStatic = 0.0;
        targetRain = 0.0;
        targetRoomTone = 0.0;
        targetCarrier = 0.0;
        targetSubDrone = 0.0;
        break;

      case 'silent':
      default:
        targetWind = 0.0;
        targetStatic = 0.0;
        targetRain = 0.0;
        targetRoomTone = 0.0;
        targetCarrier = 0.0;
        targetSubDrone = 0.0;
        break;
    }

    const ramp = (node: GainNode | null, target: number) => {
      if (!node || !this.ctx) return;
      try {
        node.gain.cancelScheduledValues(now);
        node.gain.setValueAtTime(node.gain.value, now);
        node.gain.linearRampToValueAtTime(target, targetTime);
      } catch {
        // Fallback
      }
    };

    ramp(this.windGain, targetWind);
    ramp(this.staticGain, targetStatic);
    ramp(this.rainGain, targetRain);
    ramp(this.roomToneGain, targetRoomTone);
    ramp(this.carrierGain, targetCarrier);
    ramp(this.subDroneGain, targetSubDrone);
  }

  /* =========================================================================
     TACTICAL SOUND SYNTHESIS METHODS (DRY, MECHANICAL, NON-HARSH)
     ========================================================================= */

  /**
   * Short, crisp mechanical relay click when navigating between major pages.
   */
  public playNavClick(): void {
    if (this.sfxMuted) return;
    const now = performance.now();
    if (now - this.lastNavClickTime < 80) return; // Deduplicate
    this.lastNavClickTime = now;

    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Damped impulse: short high click followed by microswitch snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(3.5, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.022);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.03);
    } catch {
      // Audio node failure fallback
    }
  }

  /**
   * Mechanical microswitch click for selecting tabs, opening menus, activating buttons.
   */
  public playButtonClick(): void {
    if (this.sfxMuted) return;
    const now = performance.now();
    if (now - this.lastBtnClickTime < 60) return;
    this.lastBtnClickTime = now;

    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.018);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.025);
    } catch {
      // Audio node fallback
    }
  }

  /**
   * Subtle paper / archival dossier opening rustle.
   */
  public playDocOpen(): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const duration = 0.09;
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * duration), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Band-passed friction noise
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.linearRampToValueAtTime(1400, t + duration);
      filter.Q.setValueAtTime(2.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + duration);
    } catch {
      // Fallback
    }
  }

  /**
   * Quiet crisp selection sound when selecting a map location or evidence item.
   */
  public playSelect(): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1480, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.015);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.022);
    } catch {
      // Fallback
    }
  }

  /**
   * Quiet teletype / mechanical keyboard keystroke sound.
   */
  public playKeypress(): void {
    if (this.sfxMuted) return;
    const now = performance.now();
    if (now - this.lastKeypressTime < 40) return; // Prevent key clatter spam
    this.lastKeypressTime = now;

    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Slight pitch variance for organic typewriter feel
      const baseFreq = 1100 + Math.random() * 250;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.012);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.014);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.018);
    } catch {
      // Fallback
    }
  }

  /**
   * Restrained, dignified tactical confirmation chime.
   * Plays ONLY upon genuine successful solve validation.
   */
  public playSuccess(): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      
      // Dual resonant sine chime (523Hz C5 -> 784Hz G5)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, t);
      gain1.gain.setValueAtTime(0.001, t);
      gain1.gain.linearRampToValueAtTime(0.35, t + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, t + 0.08);
      gain2.gain.setValueAtTime(0.001, t + 0.08);
      gain2.gain.linearRampToValueAtTime(0.4, t + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      osc1.start(t);
      osc1.stop(t + 0.3);
      osc2.start(t + 0.08);
      osc2.stop(t + 0.4);
    } catch {
      // Fallback
    }
  }

  /**
   * Subtle dull reject buzz on actual incorrect credential submission.
   */
  public playError(): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, t);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(95, t + 0.14);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.16);
    } catch {
      // Fallback
    }
  }

  /**
   * Controlled electronic glitch interference burst (180ms filtered crackle).
   * Restrained, non-startling, calibrated for investigative terminal interference.
   */
  public playGlitchInterference(): void {
    if (this.sfxMuted) return;
    const now = performance.now();
    if (now - this.lastGlitchTime < 120) return;
    this.lastGlitchTime = now;

    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // High frequency erratic impulses
        data[i] = (Math.random() > 0.85 ? (Math.random() * 2 - 1) : 0) * 0.22;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, t);
      filter.Q.setValueAtTime(2.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.18);
    } catch {
      // Fallback
    }
  }

  /**
   * Low-frequency carrier hum pulse (60Hz/120Hz transformer surge).
   */
  public playGlitchHum(): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.linearRampToValueAtTime(58, t + 0.35);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.36);
    } catch {
      // Fallback
    }
  }

  /**
   * Synchronized digital static burst during visual glitch tearing.
   * Tight bandpass with pseudo-random impulse density.
   */
  public playGlitchStaticBurst(intensity = 0.5): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const dur = Math.min(0.24, Math.max(0.06, 0.08 * (1 + intensity)));
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      const density = Math.min(0.95, 0.70 + intensity * 0.2);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() > density ? (Math.random() * 2 - 1) : 0) * (0.2 + intensity * 0.15);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600 + intensity * 1200, t);
      filter.Q.setValueAtTime(3.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22 * intensity, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + dur);
    } catch {
      // Fallback
    }
  }

  /**
   * Subtle low electronic pulse or mechanical relay flutter during recovery attempts.
   */
  public playGlitchPulse(): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, t);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(75, t);
      osc.frequency.linearRampToValueAtTime(50, t + 0.12);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.13);
    } catch {
      // Fallback
    }
  }

  /**
   * Clean, abrupt signal cutoff pop (micro-transient indicating terminal power interruption).
   */
  public playGlitchCutoff(): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(45, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.02);
    } catch {
      // Fallback
    }
  }

  /**
   * Stops all active glitch sounds immediately. Guaranteed silence.
   */
  public stopAllGlitchSounds(): void {
    try {
      this.activeGlitchNodes.forEach((node) => {
        try {
          node.stop();
        } catch {
          // Ignore
        }
      });
    } catch {
      // Ignore
    }
    this.activeGlitchNodes = [];
  }

  /**
   * Layered cinematic digital corruption soundscape for system failure:
   * - Distorted transmission noise
   * - Digital clipping and broken audio bursts
   * - Short static interruptions and micro-dropouts
   * - Glitching electronic carrier tones
   * - Abrupt silence
   */
  public playLayeredDigitalCorruption(duration = 0.55, intensity = 0.8): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const dur = Math.max(0.40, Math.min(0.85, duration));

      // 1. Distorted Carrier Oscillator (Harmonic collapse & pitch drop)
      const carrier = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(1420 + Math.random() * 400, t);
      carrier.frequency.exponentialRampToValueAtTime(320 + Math.random() * 120, t + dur * 0.7);
      carrier.frequency.linearRampToValueAtTime(110, t + dur);

      subOsc.type = 'square';
      subOsc.frequency.setValueAtTime(240, t);
      subOsc.frequency.linearRampToValueAtTime(95, t + dur);

      // 2. Waveshaper for authentic digital clipping distortion
      const shaper = this.ctx.createWaveShaper();
      const n_samples = 256;
      const curve = new Float32Array(n_samples);
      const k = 18 * intensity;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
      }
      shaper.curve = curve;
      shaper.oversample = '2x';

      // 3. Broken Static Burst (Granular impulse noise)
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const isDropout = Math.sin(i * 0.08) > 0.7;
        data[i] = isDropout ? 0 : (Math.random() * 2 - 1) * (0.25 + intensity * 0.15);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2800 + Math.random() * 1000, t);
      noiseFilter.Q.setValueAtTime(2.2, t);

      // 4. Stutter Gating (Simulating packet loss and broken transmission bursts)
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, t);
      masterGain.gain.linearRampToValueAtTime(0.18 * intensity, t + 0.015);
      masterGain.gain.setValueAtTime(0.18 * intensity, t + dur * 0.3);
      masterGain.gain.setValueAtTime(0.001, t + dur * 0.32);
      masterGain.gain.setValueAtTime(0.20 * intensity, t + dur * 0.35);
      masterGain.gain.setValueAtTime(0.001, t + dur * 0.62);
      masterGain.gain.setValueAtTime(0.16 * intensity, t + dur * 0.65);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      carrier.connect(shaper);
      subOsc.connect(shaper);
      shaper.connect(masterGain);

      noise.connect(noiseFilter);
      noiseFilter.connect(masterGain);

      masterGain.connect(this.sfxGain);

      let stopped = false;
      const stopNode = () => {
        if (stopped) return;
        stopped = true;
        try {
          masterGain.gain.cancelScheduledValues(0);
          masterGain.gain.setValueAtTime(0.0001, this.ctx?.currentTime ?? 0);
          carrier.stop();
          subOsc.stop();
          noise.stop();
          carrier.disconnect();
          subOsc.disconnect();
          noise.disconnect();
        } catch {
          // Handled
        }
      };

      const tracked = { stop: stopNode };
      this.activeGlitchNodes.push(tracked);

      carrier.start(t);
      subOsc.start(t);
      noise.start(t);
      carrier.stop(t + dur);
      subOsc.stop(t + dur);
      noise.stop(t + dur);

      setTimeout(() => {
        const idx = this.activeGlitchNodes.indexOf(tracked);
        if (idx !== -1) {
          this.activeGlitchNodes.splice(idx, 1);
        }
      }, (dur + 0.1) * 1000);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Final interrupted transmission sound:
   * Power collapse, digital carrier dying mid-cycle, followed by absolute silence.
   */
  public playFinalInterruptedTransmission(): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 0.75;

      const osc = this.ctx.createOscillator();
      const popOsc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(840, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + dur * 0.85);

      popOsc.type = 'square';
      popOsc.frequency.setValueAtTime(60, t + dur * 0.84);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, t);
      filter.frequency.linearRampToValueAtTime(180, t + dur * 0.85);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.02);
      gain.gain.setValueAtTime(0.18, t + dur * 0.8);
      gain.gain.setValueAtTime(0.35, t + dur * 0.85);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.88);

      osc.connect(filter);
      popOsc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      let stopped = false;
      const stopNode = () => {
        if (stopped) return;
        stopped = true;
        try {
          gain.gain.cancelScheduledValues(0);
          gain.gain.setValueAtTime(0.0001, this.ctx?.currentTime ?? 0);
          osc.stop();
          popOsc.stop();
          osc.disconnect();
          popOsc.disconnect();
        } catch {}
      };

      const tracked = { stop: stopNode };
      this.activeGlitchNodes.push(tracked);

      osc.start(t);
      popOsc.start(t + dur * 0.84);
      osc.stop(t + dur * 0.9);
      popOsc.stop(t + dur * 0.9);

      setTimeout(() => {
        const idx = this.activeGlitchNodes.indexOf(tracked);
        if (idx !== -1) {
          this.activeGlitchNodes.splice(idx, 1);
        }
      }, (dur + 0.15) * 1000);
    } catch {}
  }

  /**
   * Sharp, high-pitched electronic sound lasting approximately 0.5 seconds.
   * Synthesizes authentic layered transmission interference.
   */
  public playGlitchHighBurst(duration = 0.5): void {
    this.playLayeredDigitalCorruption(duration, 0.85);
  }

  /**
   * Quiet, dry two-tone alert chime for incoming messages and important announcements.
   */
  public playNotification(): void {
    if (this.sfxMuted) return;
    this.resumeContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(540, t);
      osc1.frequency.setValueAtTime(540, t + 0.04);
      osc1.frequency.exponentialRampToValueAtTime(680, t + 0.08);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1080, t);
      osc2.frequency.exponentialRampToValueAtTime(1360, t + 0.08);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.15);
      osc2.stop(t + 0.15);
    } catch {
      // Fallback
    }
  }

  /* =========================================================================
     MUTE & VOLUME CONTROLS (INDEPENDENT CHANNELS)
     ========================================================================= */

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public async toggleSfxMute(): Promise<boolean> {
    this.sfxMuted = !this.sfxMuted;
    if (!this.sfxMuted) {
      await this.resumeContext();
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('tls_sfx_muted_v1', String(this.sfxMuted));
    } catch {
      // Ignored
    }
    if (!this.sfxMuted) {
      // Play a reassuring feedback click upon unmuting SFX
      this.playButtonClick();
    }
    this.notify();
    return this.sfxMuted;
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (!this.sfxMuted && this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('tls_sfx_volume_v1', String(this.sfxVolume));
    } catch {
      // Ignored
    }
    this.notify();
  }

  public isAmbientMuted(): boolean {
    return this.ambientMuted;
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public async toggleAmbientMute(): Promise<boolean> {
    this.ambientMuted = !this.ambientMuted;
    if (!this.ambientMuted) {
      await this.resumeContext();
    }
    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.linearRampToValueAtTime(this.ambientMuted ? 0 : this.ambientVolume, now + 0.15);
    }
    try {
      localStorage.setItem('tls_ambient_muted_v1', String(this.ambientMuted));
      localStorage.setItem('tls_audio_muted_v1', String(this.ambientMuted));
    } catch {
      // Ignored
    }
    this.notify();
    return this.ambientMuted;
  }

  public setAmbientVolume(vol: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (!this.ambientMuted && this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.linearRampToValueAtTime(this.ambientVolume, now + 0.1);
    }
    try {
      localStorage.setItem('tls_ambient_volume_v1', String(this.ambientVolume));
      localStorage.setItem('tls_audio_volume_v1', String(this.ambientVolume));
    } catch {
      // Ignored
    }
    this.notify();
  }

  public isRainMuted(): boolean {
    return this.rainMuted;
  }

  public getRainVolume(): number {
    return this.rainVolume;
  }

  public async toggleRainMute(): Promise<boolean> {
    this.rainMuted = !this.rainMuted;
    if (!this.rainMuted) {
      await this.resumeContext();
    }
    if (this.rainGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.rainGain.gain.cancelScheduledValues(now);
      this.rainGain.gain.linearRampToValueAtTime(this.rainMuted ? 0 : this.rainVolume, now + 0.15);
    }
    try {
      localStorage.setItem('tls_rain_muted_v1', String(this.rainMuted));
    } catch {
      // Ignored
    }
    this.notify();
    return this.rainMuted;
  }

  public setRainVolume(vol: number): void {
    this.rainVolume = Math.max(0, Math.min(1, vol));
    if (!this.rainMuted && this.rainGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.rainGain.gain.cancelScheduledValues(now);
      this.rainGain.gain.linearRampToValueAtTime(this.rainVolume, now + 0.1);
    }
    try {
      localStorage.setItem('tls_rain_volume_v1', String(this.rainVolume));
    } catch {
      // Ignored
    }
    this.notify();
  }

  public subscribe(fn: AudioStateSubscriber): () => void {
    this.subscribers.add(fn);
    fn(this.getState());
    return () => this.subscribers.delete(fn);
  }

  public getState(): TacticalAudioState {
    return {
      sfxMuted: this.sfxMuted,
      sfxVolume: this.sfxVolume,
      ambientMuted: this.ambientMuted,
      ambientVolume: this.ambientVolume,
      rainMuted: this.rainMuted,
      rainVolume: this.rainVolume,
      locationProfile: this.locationProfile,
    };
  }

  private notify(): void {
    const st = this.getState();
    this.subscribers.forEach((fn) => fn(st));
  }
}

export const tacticalAudio = new TacticalAudioController();
