import { create } from 'zustand';
import type { SoundCloudTrack } from '@/types';

interface PlayerState {
  currentTrack: SoundCloudTrack | null;
  isPlaying: boolean;
  isModalOpen: boolean;

  // Actions
  playTrack: (track: SoundCloudTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  toggleModal: () => void;
  setModalOpen: (isOpen: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  isModalOpen: false,

  playTrack: (track) => {
    set({ currentTrack: track, isPlaying: true, isModalOpen: false });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  resume: () => {
    set({ isPlaying: true });
  },

  stop: () => {
    set({ currentTrack: null, isPlaying: false });
  },

  toggleModal: () => {
    set((state) => ({ isModalOpen: !state.isModalOpen }));
  },

  setModalOpen: (isOpen) => {
    set({ isModalOpen: isOpen });
  },
}));
