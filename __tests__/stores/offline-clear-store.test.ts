/**
 * 오프라인 클리어 큐 무결성 테스트
 * — 유실 방지가 목적이므로 FIFO 보존 / 정확한 제거 / 상한 처리를 확인한다.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useOfflineClearStore } from "@/stores/offline-clear-store";

const sample = (stage: number) => ({
  stage,
  clearTime: 100 + stage,
  hintsUsed: 0,
  stars: 3,
});

describe("offline-clear-store", () => {
  beforeEach(() => {
    useOfflineClearStore.setState({ pending: [] });
  });

  it("enqueue는 FIFO 순서로 쌓이고 id가 부여된다", () => {
    const { enqueue } = useOfflineClearStore.getState();
    enqueue(sample(1));
    enqueue(sample(2));

    const pending = useOfflineClearStore.getState().getPending();
    expect(pending).toHaveLength(2);
    expect(pending.map((p) => p.stage)).toEqual([1, 2]); // 넣은 순서 유지
    expect(pending[0].id).toBeTruthy();
    expect(pending[0].id).not.toBe(pending[1].id);
  });

  it("dequeue는 해당 id만 제거하고 나머지는 보존한다", () => {
    const { enqueue, dequeue } = useOfflineClearStore.getState();
    enqueue(sample(1));
    enqueue(sample(2));
    const [first] = useOfflineClearStore.getState().getPending();

    dequeue(first.id);

    const pending = useOfflineClearStore.getState().getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].stage).toBe(2); // 남은 건 유실되지 않음
  });

  it("상한(100)을 넘으면 가장 오래된 것부터 버린다", () => {
    const { enqueue } = useOfflineClearStore.getState();
    for (let i = 1; i <= 101; i++) enqueue(sample(i));

    const pending = useOfflineClearStore.getState().getPending();
    expect(pending).toHaveLength(100);
    expect(pending[0].stage).toBe(2); // stage 1이 밀려남
    expect(pending[99].stage).toBe(101);
  });

  it("hasPending은 큐 상태를 정확히 반영한다", () => {
    expect(useOfflineClearStore.getState().hasPending()).toBe(false);
    useOfflineClearStore.getState().enqueue(sample(1));
    expect(useOfflineClearStore.getState().hasPending()).toBe(true);
  });
});
