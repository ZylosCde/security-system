import { ScanEvent, Violation, Incident } from './types';

const QUEUE_KEY = 'aegis_offline_queue';

export type QueuedEvent = 
  | { type: 'scan'; payload: ScanEvent }
  | { type: 'violation'; payload: Violation }
  | { type: 'incident'; payload: Incident }
  | { type: 'sos'; payload: Record<string, unknown> };

export function queueEvent(event: QueuedEvent) {
  const queue: any[] = getQueue();
  queue.push({ ...event, queuedAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue(): any[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function syncQueue(onProgress?: (count: number) => void): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  // Simulate network delay + success
  await new Promise((r) => setTimeout(r, 600));
  onProgress?.(queue.length);
  clearQueue();
  return queue.length;
}

export function hasPendingSync(): boolean {
  return getQueue().length > 0;
}