export type EndReason = 'time' | 'hull';
export interface GameConfig { sessionTime: number; spawnTime: number; }
export interface MatchRecord { id: string; playerId: string; playerName: string; shipName?: string; date: string; score: number; duration: number; reason: EndReason; config: GameConfig; }
export interface Page<T> { items: T[]; page: number; pageSize: number; total: number; }
export type NetworkScenario = 'normal' | 'empty' | 'slow' | 'offline' | 'server-error';
