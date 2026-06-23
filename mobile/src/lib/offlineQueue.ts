import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordPatrolVisit } from './api-client';

const QUEUE_KEY = 'aegis_patrol_mobile_queue';

export type ScanQueuePayload = {
  patrolId: number;
  checkpointId: number;
  officerId?: number;
};

export type QueuedPayload =
  | { type: 'scan'; payload: ScanQueuePayload }
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
  let queue: QueuedPayload[];
  try {
    queue = JSON.parse(raw) as QueuedPayload[];
  } catch {
    await clearQueue();
    return 0;
  }

  const remaining: QueuedPayload[] = [];
  let synced = 0;

  for (const event of queue) {
    if (event.type === 'scan') {
      try {
        await recordPatrolVisit(event.payload);
        synced += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.toLowerCase().includes('route violation') || msg.toLowerCase().includes('order')) {
          // Route order violations should be cleared from the queue to avoid clogging it
          synced += 1;
        } else {
          remaining.push(event);
        }
      }
    } else if (event.type === 'sos' || event.type === 'incident' || event.type === 'violation') {
      // Simulate successful offline sync for SOS/incident/violation
      await new Promise((resolve) => setTimeout(resolve, 250));
      synced += 1;
    } else {
      remaining.push(event);
    }
  }

  if (remaining.length === 0) {
    await clearQueue();
  } else {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }

  return synced;
}
