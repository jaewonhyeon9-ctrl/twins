export type TwinId = 'twin1' | 'twin2';
export type EventType = 'feed' | 'diaper' | 'medicine' | 'note' | 'babyfood';

export interface BaseEvent {
  id: string;
  twinId: TwinId;
  timestamp: number;
  type: EventType;
  note?: string;
}

export interface FeedEvent extends BaseEvent {
  type: 'feed';
  amount: number; // ml
}

export interface BabyfoodEvent extends BaseEvent {
  type: 'babyfood';
  menu: string;
  amount: number; // ml or g
}

export interface DiaperEvent extends BaseEvent {
  type: 'diaper';
  status: 'pee' | 'poop' | 'both';
}

export interface MedicineEvent extends BaseEvent {
  type: 'medicine';
  medicineName: string;
}

export interface NoteEvent extends BaseEvent {
  type: 'note';
}

export type BabyEvent = FeedEvent | BabyfoodEvent | DiaperEvent | MedicineEvent | NoteEvent;

export interface TwinProfile {
  id: TwinId;
  name: string;
  color: string;
}
