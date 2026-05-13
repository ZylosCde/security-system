import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'aegis_patrol_mobile_queue';

export type QueuedPayload =
  | { type: 'scan'; payload: unknown }
  | { type: 'violation'; payload: unknown }
  | { type: 'incident'; payload: unknown }
  | { type: 'sos'; payload: unknown };

export async function queueEvent(event: QueuedPayload): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: unknown[] = raw ? JSON.parse(raw) : [];
  queue.push({ ...event, queuedAt: new Date().toISOString() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueueLength(): Promise<number> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return 0;
  try {
    return JSON.parse(raw).length;
  } catch {
    return 0;
  }
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function syncQueue(): Promise<number> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return 0;
  try {
    const len = JSON.parse(raw).length;
    await clearQueue();
    return len;
  } catch {
    return 0;
  }
}
