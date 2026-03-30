import { describe, it, expect } from 'vitest';
import {
  getStageRange,
  getStageConfig,
  getStageLabel,
  getAllStageConfigs,
  interpolate,
} from '@/lib/sudoku/difficulty';
import { STAGE_RANGES } from '@/types/game';

// ─── getStageRange ──────────────────────────────────

describe('getStageRange', () => {
  it('스테이지 1은 입문 구간을 반환한다', () => {
    const range = getStageRange(1);
    expect(range.label).toBe('입문');
    expect(range.startStage).toBe(1);
    expect(range.endStage).toBe(10);
  });

  it('스테이지 10은 입문 구간의 끝이다', () => {
    const range = getStageRange(10);
    expect(range.label).toBe('입문');
  });

  it('스테이지 11은 초급 구간이다', () => {
    const range = getStageRange(11);
    expect(range.label).toBe('초급');
  });

  it('스테이지 50은 마스터 구간이다', () => {
    const range = getStageRange(50);
    expect(range.label).toBe('마스터');
    expect(range.allowChainLocks).toBe(true);
  });

  it('0 이하의 스테이지는 에러를 던진다', () => {
    expect(() => getStageRange(0)).toThrow('Invalid stage number');
    expect(() => getStageRange(-1)).toThrow('Invalid stage number');
  });

  it('51 이상의 스테이지는 에러를 던진다', () => {
    expect(() => getStageRange(51)).toThrow('Invalid stage number');
  });

  it('소수점 스테이지는 에러를 던진다', () => {
    expect(() => getStageRange(1.5)).toThrow('Invalid stage number');
  });

  it('모든 구간 경계가 정상적으로 매핑된다', () => {
    for (const range of STAGE_RANGES) {
      expect(getStageRange(range.startStage).label).toBe(range.label);
      expect(getStageRange(range.endStage).label).toBe(range.label);
    }
  });
});

// ─── interpolate ────────────────────────────────────

describe('interpolate', () => {
  const sampleRange = STAGE_RANGES[0]; // 입문: 1~10

  it('구간 시작 스테이지는 최솟값을 반환한다', () => {
    const result = interpolate(1, sampleRange, [28, 37]);
    expect(result).toBe(28);
  });

  it('구간 끝 스테이지는 최댓값을 반환한다', () => {
    const result = interpolate(10, sampleRange, [28, 37]);
    expect(result).toBe(37);
  });

  it('구간 중간은 보간된 값을 반환한다', () => {
    const result = interpolate(5, sampleRange, [28, 37]);
    // (5-1)/(10-1) = 4/9 ≈ 0.444 → 28 + 0.444*9 ≈ 32
    expect(result).toBe(32);
  });

  it('반환값은 정수이다', () => {
    for (let stage = 1; stage <= 10; stage++) {
      const result = interpolate(stage, sampleRange, [28, 37]);
      expect(Number.isInteger(result)).toBe(true);
    }
  });
});

// ─── getStageConfig ─────────────────────────────────

describe('getStageConfig', () => {
  it('스테이지 1의 설정이 올바르다', () => {
    const config = getStageConfig(1);
    expect(config.stage).toBe(1);
    expect(config.emptyCells).toBe(28);
    expect(config.lockedCellCount).toBe(0);
    expect(config.allowedLockTypes).toEqual([]);
    expect(config.allowChainLocks).toBe(false);
  });

  it('스테이지 10의 빈 칸 수는 최댓값이다', () => {
    const config = getStageConfig(10);
    expect(config.emptyCells).toBe(37);
    expect(config.lockedCellCount).toBe(0);
  });

  it('스테이지 15의 잠금 칸이 1~3 범위이다', () => {
    const config = getStageConfig(15);
    expect(config.lockedCellCount).toBeGreaterThanOrEqual(1);
    expect(config.lockedCellCount).toBeLessThanOrEqual(3);
    expect(config.allowedLockTypes).toContain('row-complete');
  });

  it('스테이지 25의 잠금 유형에 number-complete가 포함된다', () => {
    const config = getStageConfig(25);
    expect(config.allowedLockTypes).toContain('number-complete');
  });

  it('스테이지 45는 연쇄 잠금이 허용된다', () => {
    const config = getStageConfig(45);
    expect(config.allowChainLocks).toBe(true);
    expect(config.lockedCellCount).toBeGreaterThanOrEqual(8);
  });

  it('빈 칸 수는 스테이지가 올라갈수록 단조증가한다 (구간별)', () => {
    for (const range of STAGE_RANGES) {
      const startConfig = getStageConfig(range.startStage);
      const endConfig = getStageConfig(range.endStage);
      expect(endConfig.emptyCells).toBeGreaterThanOrEqual(startConfig.emptyCells);
    }
  });

  it('모든 50 스테이지의 빈 칸 수가 28~58 범위이다', () => {
    for (let stage = 1; stage <= 50; stage++) {
      const config = getStageConfig(stage);
      expect(config.emptyCells).toBeGreaterThanOrEqual(28);
      expect(config.emptyCells).toBeLessThanOrEqual(58);
    }
  });

  it('allowedLockTypes는 원본 배열의 참조가 아니다 (불변성)', () => {
    const config1 = getStageConfig(15);
    const config2 = getStageConfig(15);
    expect(config1.allowedLockTypes).not.toBe(config2.allowedLockTypes);
    expect(config1.allowedLockTypes).toEqual(config2.allowedLockTypes);
  });
});

// ─── getAllStageConfigs ──────────────────────────────

describe('getAllStageConfigs', () => {
  it('50개의 StageConfig를 반환한다', () => {
    const configs = getAllStageConfigs();
    expect(configs).toHaveLength(50);
  });

  it('스테이지 번호가 1~50 순서이다', () => {
    const configs = getAllStageConfigs();
    configs.forEach((config, i) => {
      expect(config.stage).toBe(i + 1);
    });
  });
});

// ─── getStageLabel ──────────────────────────────────

describe('getStageLabel', () => {
  it.each([
    [1, '입문'],
    [10, '입문'],
    [11, '초급'],
    [20, '초급'],
    [21, '중급'],
    [30, '중급'],
    [31, '고급'],
    [40, '고급'],
    [41, '마스터'],
    [50, '마스터'],
  ])('스테이지 %d → %s', (stage, label) => {
    expect(getStageLabel(stage)).toBe(label);
  });
});
