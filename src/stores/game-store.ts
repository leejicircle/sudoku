import { create } from "zustand";

interface GameState {
  difficulty: "easy" | "medium" | "hard" | "expert";
  isPlaying: boolean;
  setDifficulty: (difficulty: GameState["difficulty"]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  difficulty: "medium",
  isPlaying: false,
  setDifficulty: (difficulty) => set({ difficulty }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
}));
