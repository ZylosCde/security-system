import type { Officer, Route, Checkpoint } from '../types';
import { generateRotatingToken } from '../lib/qrService';

function checkpoint(
  id: string,
  name: string,
  premises: string,
  lat: number,
  lng: number
): Checkpoint {
  return {
    id,
    name,
    premises,
    lat,
    lng,
    qrToken: generateRotatingToken(id, premises),
  };
}

export const OFFICERS: Officer[] = [
  { id: 'O-101', name: 'Rohan Silva', nic: '982345678V', status: 'on-duty' },
  { id: 'O-102', name: 'Amara Perera', nic: '951234567V', status: 'on-duty' },
  { id: 'O-103', name: 'Kasun Fernando', nic: '200145678V', status: 'off-duty' },
  { id: 'O-104', name: 'Nimali Wijesinghe', nic: '887654321V', status: 'on-break' },
];

export const CHECKPOINTS: Checkpoint[] = [
  checkpoint('C-01', 'Main Gate - North', 'VISTA Towers', 6.9271, 79.8612),
  checkpoint('C-02', 'Loading Bay', 'VISTA Towers', 6.9268, 79.8625),
  checkpoint('C-03', 'Parking Level B2', 'VISTA Towers', 6.9274, 79.8601),
  checkpoint('C-04', 'Rooftop Access', 'VISTA Towers', 6.9281, 79.8619),
];

export const DEFAULT_ROUTE: Route = {
  id: 'R-01',
  name: 'VISTA Night Perimeter',
  checkpoints: ['C-01', 'C-02', 'C-03', 'C-04'],
  expectedDuration: 42,
};

export const DEVICE_ID = 'D-MOBILE-001';
