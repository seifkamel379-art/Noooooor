import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

interface AudioState {
  reciterId: string;
  reciterName: string;
  serverUrl: string;
  surahNum: number | null;
  surahName: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
}

interface AudioContextType extends AudioState {
  play: (opts: { reciterId: string; reciterName: string; serverUrl: string; surahNum: number; surahName: string }) => void;
  togglePlay: () => void;
  pause: () => void;
  seek: (fraction: number) => void;
  stop: () => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

const audioEl = new Audio();
audioEl.preload = 'auto';

export function AudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioState>({
    reciterId: '',
    reciterName: '',
    serverUrl: '',
    surahNum: null,
    surahName: '',
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
  });

  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    setState(s => ({ ...s, currentTime: audioEl.currentTime, duration: audioEl.duration || 0 }));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startTick = () => { rafRef.current = requestAnimationFrame(tick); };
  const stopTick = () => cancelAnimationFrame(rafRef.current);

  audioEl.onplay = () => { setState(s => ({ ...s, isPlaying: true, isLoading: false })); startTick(); };
  audioEl.onpause = () => { setState(s => ({ ...s, isPlaying: false })); stopTick(); };
  audioEl.onended = () => { setState(s => ({ ...s, isPlaying: false, currentTime: 0 })); stopTick(); };
  audioEl.onwaiting = () => setState(s => ({ ...s, isLoading: true }));
  audioEl.oncanplay = () => setState(s => ({ ...s, isLoading: false }));
  audioEl.ondurationchange = () => setState(s => ({ ...s, duration: audioEl.duration || 0 }));

  const play = useCallback(({ reciterId, reciterName, serverUrl, surahNum, surahName }: {
    reciterId: string; reciterName: string; serverUrl: string; surahNum: number; surahName: string;
  }) => {
    const surahPad = surahNum.toString().padStart(3, '0');
    const url = `${serverUrl}${surahPad}.mp3`;
    audioEl.src = url;
    audioEl.load();
    audioEl.play().catch(() => {});
    setState(s => ({ ...s, reciterId, reciterName, serverUrl, surahNum, surahName, isLoading: true, currentTime: 0 }));
  }, []);

  const togglePlay = useCallback(() => {
    if (audioEl.paused) {
      audioEl.play().catch(() => {});
    } else {
      audioEl.pause();
    }
  }, []);

  const pause = useCallback(() => { audioEl.pause(); }, []);

  const seek = useCallback((fraction: number) => {
    if (!audioEl.duration) return;
    audioEl.currentTime = fraction * audioEl.duration;
  }, []);

  const stop = useCallback(() => {
    audioEl.pause();
    audioEl.src = '';
    stopTick();
    setState(s => ({ ...s, isPlaying: false, surahNum: null, currentTime: 0, duration: 0 }));
  }, []);

  return (
    <AudioCtx.Provider value={{ ...state, play, togglePlay, pause, seek, stop }}>
      {children}
    </AudioCtx.Provider>
  );
}

export const useAudio = () => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
};
