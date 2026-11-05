/** min · contracte orientatiu de la implementació Expo 58.
 * Els fitxers d'intercanvi es validen abans de persistir-los.
 * Les preferències personals no s'exporten al document compartit.
 */
export type ID = string;
export type ISOInstant = string;
export interface Person { id: ID; name: string; disambiguation?: string; teamIds: ID[] }
export interface Team { id: ID; name: string; personIds: ID[] }
export interface Role { id: ID; name: string; personIds: ID[]; teamIds: ID[] }
interface BaseTask {
  id: ID; title: string; sortOrder: number; place?: string; notes?: string;
  personIds: ID[]; teamIds: ID[]; roles: Role[]; common: boolean;
  checklist: { id: ID; text: string }[];
}
export type Task = BaseTask & (
  | { kind: 'point'; startsAt: ISOInstant }
  | { kind: 'interval'; startsAt: ISOInstant; endsAt: ISOInstant }
  | { kind: 'after'; afterTaskId: ID }
);
export interface SharedDocument {
  schemaVersion: 1; documentId: ID; revision: number; publishedAt: ISOInstant;
  event: {
    title: string; organization: string; startsAt: ISOInstant; endsAt: ISOInstant;
    timeZone: string; notes?: string; accent: 'blue' | 'lime' | 'lilac' | 'peach' | 'red';
  };
  people: Person[]; teams: Team[]; tasks: Task[];
}
export interface LocalPreferences {
  documentId: ID; mePersonId?: ID; filter: 'all' | 'mine'; includeCommon: boolean;
  followingPersonId?: ID; liveMode: 'off' | 'all' | 'mine';
  reminderMinutes: null | 5 | 10 | 15; theme: 'system' | 'light' | 'dark';
}
export type EventStatus = 'upcoming' | 'active' | 'finished';
export const eventStatus = (e: SharedDocument['event'], nowMs: number): EventStatus =>
  nowMs < Date.parse(e.startsAt) ? 'upcoming' : nowMs < Date.parse(e.endsAt) ? 'active' : 'finished';
// L'interval actiu és [inici, final). Els noms no són claus d'identitat.
// Una tasca "after" no rep una hora ni una finalització global deduïda.
