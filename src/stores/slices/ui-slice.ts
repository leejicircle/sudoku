/**
 * UI 슬라이스 -- 셀 선택, 메모 모드, 힌트 사용 횟수
 *
 * 게임 로직과 독립된 순수 UI 상태만 관리한다.
 * initGame/reset 시 game-core-slice에서 직접 초기화한다.
 */

import type { SliceCreator, UISlice } from '../types';

export const createUISlice: SliceCreator<UISlice> = (set) => ({
  selectedCell: null,
  isNoteMode: false,
  hintsUsed: 0,

  selectCell: (position) => {
    set({ selectedCell: position });
  },

  toggleNoteMode: () => {
    set((state) => ({ isNoteMode: !state.isNoteMode }));
  },
});
