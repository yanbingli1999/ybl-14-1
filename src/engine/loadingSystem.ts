import { Train, Carriage, CandyType } from '@/types';
import { GAME_CONFIG } from '@/data/config';

export function loadCandiesToTrain(train: Train, candyCounts: Record<CandyType, number>): {
  train: Train;
  overflow: Record<CandyType, number>;
  totalLoaded: number;
} {
  const newCarriages = train.carriages.map(c => ({ ...c }));
  const overflow: Record<string, number> = {};
  let totalLoaded = 0;

  for (const candyType of Object.keys(candyCounts) as CandyType[]) {
    const count = candyCounts[candyType];
    const carriage = newCarriages.find(c => c.candyType === candyType);

    if (carriage) {
      const availableSpace = carriage.capacity - carriage.currentLoad;
      const toLoad = Math.min(count, availableSpace);
      carriage.currentLoad += toLoad;
      totalLoaded += toLoad;

      if (count > availableSpace) {
        overflow[candyType] = count - availableSpace;
      }
    } else {
      overflow[candyType] = count;
    }
  }

  return {
    train: { ...train, carriages: newCarriages },
    overflow: overflow as Record<CandyType, number>,
    totalLoaded,
  };
}

export function getLoadPercentage(carriage: Carriage): number {
  if (carriage.capacity === 0) return 0;
  return (carriage.currentLoad / carriage.capacity) * 100;
}

export function getTotalLoad(train: Train): number {
  return train.carriages.reduce((sum, c) => sum + c.currentLoad, 0);
}

export function getTotalCapacity(train: Train): number {
  return train.carriages.reduce((sum, c) => sum + c.capacity, 0);
}

export function isTrainFull(train: Train): boolean {
  return train.carriages.every(c => c.currentLoad >= c.capacity);
}

export function getTrainLoadPercentage(train: Train): number {
  const totalLoad = getTotalLoad(train);
  const totalCapacity = getTotalCapacity(train);
  if (totalCapacity === 0) return 0;
  return (totalLoad / totalCapacity) * 100;
}

export function clearTrain(train: Train): Train {
  return {
    ...train,
    carriages: train.carriages.map(c => ({ ...c, currentLoad: 0 })),
  };
}

export function getCandyLoad(train: Train, candyType: CandyType): number {
  const carriage = train.carriages.find(c => c.candyType === candyType);
  return carriage?.currentLoad || 0;
}
