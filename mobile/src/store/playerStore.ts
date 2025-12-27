import { create } from 'zustand';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

interface PlayerState {
  // Track and stream info
  currentTrack: SoundCloudTrack | null;
  streamUrl: string | null;

  // Playback state
  isPlaying: boolean;
  loading: boolean;
  error: string | null;

  // UI state
  isModalOpen: boolean;

  // Actions
  setStreamUrl: (url: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  playTrack: (track: SoundCloudTrack) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  toggleModal: () => void;
  setModalOpen: (isOpen: boolean) => void;
}

export const usePlayerStore = create<PlayerState>(set => ({
  // Initial state
  currentTrack: null,
  streamUrl: null,
  isPlaying: false,
  loading: false,
  error: null,
  isModalOpen: false,

  // Set the stream URL
  setStreamUrl: url => {
    set({ streamUrl: url });
  },

  // Set loading state
  setLoading: loading => {
    set({ loading });
  },

  // Set error state
  setError: error => {
    set({ error });
  },

  // Play a track (sets track and prepares for playback)
  playTrack: track => {
    set({
      currentTrack: track,
      isPlaying: true,
      isModalOpen: false,
      error: null,
    });
  },

  // Start playback (just updates state - actual playback controlled by PlayerContext)
  play: () => {
    set({ isPlaying: true });
  },

  // Pause playback (just updates state - actual playback controlled by PlayerContext)
  pause: () => {
    set({ isPlaying: false });
  },

  // Resume playback (just updates state - actual playback controlled by PlayerContext)
  resume: () => {
    set({ isPlaying: true });
  },

  // Stop playback and clear track
  stop: () => {
    set({
      currentTrack: null,
      isPlaying: false,
      streamUrl: null,
      error: null,
    });
  },

  // Toggle modal visibility
  toggleModal: () => {
    set(state => ({ isModalOpen: !state.isModalOpen }));
  },

  // Set modal visibility
  setModalOpen: isOpen => {
    set({ isModalOpen: isOpen });
  },
}));
