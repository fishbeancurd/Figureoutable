export type SizeClass = 'toy' | 'small' | 'medium' | 'large' | 'giant';
export type Sex = 'female' | 'male';
export type Activity = 'low' | 'normal' | 'high';

export interface WeightEntry {
  date: string; // ISO date
  kg: number;
}

export interface Dog {
  id: string;
  name: string;
  breed: string;
  size: SizeClass;
  sex: Sex;
  birthDate: string; // ISO date
  homecomingDate?: string;
  photoUri?: string;
  furColor?: string; // mascot color when no photo
  adultWeightKg: number; // expected adult weight (from breed, editable)
  neutered: boolean;
  activity: Activity;
  allergies: string[];
  weights: WeightEntry[];
  notes?: string;
}

export interface Owner {
  name: string;
  wake: string; // "HH:MM"
  bed: string;
  workStart: string;
  workEnd: string;
  workDays: number[]; // 0 = Sunday
  worksFromHome: boolean;
}

export type Liking = 'loves' | 'likes' | 'meh' | 'dislikes';
export type TreatValue = 'high' | 'medium' | 'low';
export type Reaction = 'none' | 'upset' | 'allergy';
export type FoodKind = 'meal' | 'treat' | 'chew' | 'fresh';

export interface Food {
  id: string;
  name: string;
  kind: FoodKind;
  kcalPerUnit: number;
  unit: string; // "cup", "g", "piece"
  liking: Liking;
  treatValue?: TreatValue;
  reaction: Reaction;
  notes?: string;
}

export type LogType =
  | 'meal'
  | 'treat'
  | 'walk'
  | 'play'
  | 'training'
  | 'potty'
  | 'grooming'
  | 'sleep'
  | 'health'
  | 'weight';

export interface LogEntry {
  id: string;
  type: LogType;
  at: string; // ISO datetime
  // meal / treat
  foodId?: string;
  foodName?: string;
  amount?: number;
  kcal?: number;
  liking?: Liking;
  reaction?: Reaction;
  // walk / play / training / sleep
  minutes?: number;
  skill?: string;
  // potty
  potty?: 'pee' | 'poo' | 'both';
  accident?: boolean;
  stool?: 'firm' | 'soft' | 'runny';
  // grooming
  groom?: GroomTask;
  // health
  symptom?: string;
  // weight
  kg?: number;
  note?: string;
}

export type GroomTask = 'brush' | 'bath' | 'nails' | 'teeth' | 'ears' | 'eyes';

export interface RoutineItem {
  id: string;
  title: string;
  type: LogType | 'potty-break' | 'nap' | 'meal-time';
  time: string; // "HH:MM"
  minutes?: number;
  days: number[]; // 0-6
  remind: boolean;
  notifIds?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUri?: string;
  verdict?: 'safe' | 'caution' | 'unsafe';
  at: string;
}

export interface AppState {
  version: 1;
  onboarded: boolean;
  owner: Owner;
  dog: Dog | null;
  foods: Food[];
  logs: LogEntry[];
  routine: RoutineItem[];
  routineDone: Record<string, string[]>; // date -> routine ids done
  lessonSteps: Record<string, number[]>; // lessonId -> completed step indexes
  checklists: Record<string, string[]>; // checklistId -> done item ids
  milestones: Record<string, string>; // milestoneId -> ISO date achieved
  chat: ChatMessage[];
  aiProxyUrl: string;
  aiToken: string;
  remindersOn: boolean;
}
