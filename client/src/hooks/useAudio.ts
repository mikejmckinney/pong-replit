import { useCallback, useRef, useEffect } from "react";
import type { GameSettings } from "@shared/schema";

interface AudioContextRef {
  context: AudioContext | null;
  gainNode: GainNode | null;
  initialized: boolean;
}

const audioContextRef: AudioContextRef = {
  context: null,
  gainNode: null,
  initialized: false,
};

function getAudioContext(): AudioContext {
  if (!audioContextRef.context) {
    audioContextRef.context = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContextRef.context;
}

function getGainNode(): GainNode {
  if (!audioContextRef.gainNode) {
    const ctx = getAudioContext();
    audioContextRef.gainNode = ctx.createGain();
    audioContextRef.gainNode.connect(ctx.destination);
  }
  return audioContextRef.gainNode;
}

export function useAudio(settings: GameSettings) {
  const settingsRef = useRef(settings);
  
  useEffect(() => {
    settingsRef.current = settings;
    if (audioContextRef.initialized && audioContextRef.gainNode) {
      audioContextRef.gainNode.gain.value = settings.soundEnabled ? settings.volume : 0;
    }
  }, [settings.soundEnabled, settings.volume, settings]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.initialized) {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const gainNode = getGainNode();
      gainNode.gain.value = settingsRef.current.soundEnabled ? settingsRef.current.volume : 0;
      audioContextRef.initialized = true;
    }
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "square") => {
    if (!settingsRef.current.soundEnabled) return;
    if (!audioContextRef.initialized) {
      initAudio();
    }
    
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    envelope.gain.setValueAtTime(0.3, ctx.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.connect(envelope);
    envelope.connect(getGainNode());
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [initAudio]);

  const playPaddleHit = useCallback(() => {
    playTone(440, 0.1, "square");
  }, [playTone]);

  const playWallHit = useCallback(() => {
    playTone(220, 0.08, "triangle");
  }, [playTone]);

  const playScore = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return;
    if (!audioContextRef.initialized) {
      initAudio();
    }
    
    const ctx = getAudioContext();
    const notes = [523, 659, 784];
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      
      oscillator.type = "square";
      oscillator.frequency.value = freq;
      
      envelope.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
      envelope.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.15);
      
      oscillator.connect(envelope);
      envelope.connect(getGainNode());
      
      oscillator.start(ctx.currentTime + i * 0.1);
      oscillator.stop(ctx.currentTime + i * 0.1 + 0.15);
    });
  }, [initAudio]);

  const playPowerUp = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return;
    if (!audioContextRef.initialized) {
      initAudio();
    }
    
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2);
    
    envelope.gain.setValueAtTime(0.3, ctx.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    oscillator.connect(envelope);
    envelope.connect(getGainNode());
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  }, [initAudio]);

  const playMenuSelect = useCallback(() => {
    playTone(660, 0.05, "square");
  }, [playTone]);

  const playMenuNavigate = useCallback(() => {
    playTone(330, 0.03, "square");
  }, [playTone]);

  const playGameOver = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return;
    if (!audioContextRef.initialized) {
      initAudio();
    }
    
    const ctx = getAudioContext();
    const notes = [392, 330, 262, 196];
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      
      oscillator.type = "sawtooth";
      oscillator.frequency.value = freq;
      
      envelope.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.2);
      envelope.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.3);
      
      oscillator.connect(envelope);
      envelope.connect(getGainNode());
      
      oscillator.start(ctx.currentTime + i * 0.2);
      oscillator.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
  }, [initAudio]);

  return {
    initAudio,
    playPaddleHit,
    playWallHit,
    playScore,
    playPowerUp,
    playMenuSelect,
    playMenuNavigate,
    playGameOver,
  };
}
