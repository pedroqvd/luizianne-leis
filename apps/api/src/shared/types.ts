export type AuthorRole = 'author' | 'coauthor' | 'rapporteur';

export type EventType =
  | 'NEW_PROPOSITION'
  | 'STATUS_CHANGED'
  | 'NEW_VOTE'
  | 'NEW_RAPPORTEUR';

export interface Deputy {
  id: number;
  external_id: number;
  name: string;
  party: string | null;
  state: string | null;
  photo_url: string | null;
}

export interface Proposition {
  id: number;
  external_id: number;
  type: string;
  number: number | null;
  year: number | null;
  title: string | null;
  summary: string | null;
  status: string | null;
  url: string | null;
  presented_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: number;
  proposition_id: number;
  deputy_id: number | null;
  vote: string;
  date: string | null;
  session_id: string | null;
}

export interface Proceeding {
  id: number;
  proposition_id: number;
  sequence: number | null;
  description: string | null;
  body: string | null;
  status_at_time: string | null;
  date: string | null;
}
