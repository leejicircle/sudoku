/**
 * 타이머 슬라이스 -- 경과 시간, 일시정지
 *
 * tick은 isPaused/isComplete/isStarted를 게임 코어 슬라이스에서 참조한다.
 * resume은 isComplete 상태에서 재개를 차단한다.
 * setValue가 게임 완료 시 isPaused를 true로 설정한다 (크로스 슬라이스 쓰기).
 */

import type { SliceCreator, TimerSlice } from '../types';

export const createTimerSlice: SliceCreator<TimerSlice> = (set, get) => ({
  timer: 0,
  isPaused: false,

  tick: () => {
    const { isPaused, isComplete, isStarted } = get();
    if (isPaused || isComplete || !isStarted) return;
    set((state) => ({ timer: state.timer + 1 }));
  },

  pause: () => {
    set({ isPaused: true });
  },

  resume: () => {
    const { isComplete } = get();
    if (isComplete) return;
    set({ isPaused: false });
  },
});
