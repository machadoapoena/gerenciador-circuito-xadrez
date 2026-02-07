
export interface Player {
  id: string;
  name: string;
  categoryId: string;
  birthDate: string;
  cbxId: string;
  fideId: string;
  email: string;
  titleId?: string; // Changed from title string to titleId
}

export interface Stage {
  id: string;
  name: string;
}

export interface Score {
  id: string;
  playerId: string;
  stageId: string;
  points: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Title {
  id: string;
  name: string;
}

export type View = 'players' | 'stages' | 'scores' | 'standings' | 'categories' | 'titles' | 'login' | 'settings';
