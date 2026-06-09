export const WINDOW_SIZE = 360;

export interface RawSample {
  sample: number[];
  timestamp: number;
}

interface WindowBuffer {
  samples: RawSample[];
  totalSamples: number;
}

class StressStore {
  private buffers = new Map<string, WindowBuffer>();

  addSample(userId: string, sample: RawSample): boolean {
    let buf = this.buffers.get(userId);
    if (!buf) {
      buf = { samples: [], totalSamples: 0 };
      this.buffers.set(userId, buf);
    }
    buf.samples.push(sample);
    buf.totalSamples++;
    return buf.samples.length >= WINDOW_SIZE;
  }

  popWindow(userId: string): RawSample[] | null {
    const buf = this.buffers.get(userId);
    if (!buf || buf.samples.length < WINDOW_SIZE) {
      return null;
    }
    return buf.samples.splice(0, WINDOW_SIZE);
  }

  getBuffer(userId: string): { totalSamples: number; buffered: number } | null {
    const buf = this.buffers.get(userId);
    if (!buf) {
      return null;
    }
    return { totalSamples: buf.totalSamples, buffered: buf.samples.length };
  }
}

let store: StressStore | null = null;

export function getStressStore(): StressStore {
  if (!store) {
    store = new StressStore();
  }
  return store;
}
