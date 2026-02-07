
export interface Player {
  id: string;
  name: string;
  categoryId: string;
  birthDate: string;
  cbxId: string;
  fideId: string;
  email: string;
  rating?: string;
  titleId?: string;
  photoUrl?: string;
}

export interface Stage {
  id: string;
  name: string;
  url?: string;
}

export interface Score {
  id: string | number;
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
