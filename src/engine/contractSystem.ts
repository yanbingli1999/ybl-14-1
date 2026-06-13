import { StationOrder, OrderItem, Station, CandyType, BASIC_CANDY_TYPES } from '@/types';
import { STATIONS, GAME_CONFIG } from '@/data/config';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateOrder(stationId: string, reputation: number): StationOrder {
  const station = STATIONS.find(s => s.id === stationId);
  if (!station) {
    throw new Error(`Station not found: ${stationId}`);
  }

  const difficultyLevel = getDifficultyLevel(stationId, reputation);
  const itemCount = getItemCount(difficultyLevel);
  const baseQuantity = getBaseQuantity(difficultyLevel);

  const availableTypes = shuffle([...BASIC_CANDY_TYPES]);
  const selectedTypes = availableTypes.slice(0, itemCount);

  const items: OrderItem[] = selectedTypes.map(type => ({
    candyType: type,
    quantity: baseQuantity + Math.floor(Math.random() * 5),
  }));

  const baseReward = items.reduce((sum, item) => sum + item.quantity * 5, 0);
  const isUrgent = Math.random() < getUrgentChance(difficultyLevel);
  const urgentBonus = isUrgent ? Math.floor(baseReward * GAME_CONFIG.URGENT_BONUS_RATE) : 0;

  const order: StationOrder = {
    id: generateId(),
    stationId,
    stationName: station.name,
    items,
    reward: baseReward,
    penalty: Math.floor(baseReward * GAME_CONFIG.MISMATCH_PENALTY_RATE) * itemCount,
    isUrgent,
    urgentBonus,
  };

  return order;
}

function getDifficultyLevel(stationId: string, reputation: number): number {
  const stationIndex = STATIONS.findIndex(s => s.id === stationId);
  const baseLevel = stationIndex + 1;

  const repBonus = Math.floor(reputation / 200);

  return Math.min(baseLevel + repBonus, 5);
}

function getItemCount(difficultyLevel: number): number {
  switch (difficultyLevel) {
    case 1: return 2;
    case 2: return 2;
    case 3: return 3;
    case 4: return 3;
    case 5: return 4;
    default: return 2;
  }
}

function getBaseQuantity(difficultyLevel: number): number {
  switch (difficultyLevel) {
    case 1: return 5;
    case 2: return 8;
    case 3: return 10;
    case 4: return 12;
    case 5: return 15;
    default: return 5;
  }
}

function getUrgentChance(difficultyLevel: number): number {
  switch (difficultyLevel) {
    case 1: return 0.1;
    case 2: return 0.2;
    case 3: return 0.35;
    case 4: return 0.4;
    case 5: return 0.5;
    default: return 0.2;
  }
}

export function getAvailableStations(reputation: number): Station[] {
  return STATIONS.filter(s => s.reputationRequired <= reputation);
}

export function getNextStation(reputation: number): Station | null {
  const locked = STATIONS.filter(s => s.reputationRequired > reputation);
  if (locked.length === 0) return null;
  return locked[0];
}

export function getStationProgress(reputation: number): { current: Station | null; next: Station | null; progress: number } {
  const available = getAvailableStations(reputation);
  const current = available.length > 0 ? available[available.length - 1] : null;
  const next = getNextStation(reputation);

  let progress = 0;
  if (current && next) {
    const range = next.reputationRequired - current.reputationRequired;
    const earned = reputation - current.reputationRequired;
    progress = range > 0 ? (earned / range) * 100 : 100;
  } else if (next) {
    progress = (reputation / next.reputationRequired) * 100;
  } else {
    progress = 100;
  }

  return { current, next, progress: Math.min(progress, 100) };
}
