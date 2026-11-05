export type ID = string;
export type ISOInstant = string;
export type Accent = 'blue' | 'lime' | 'lilac' | 'peach';

export type Person = {
  id: ID;
  name: string;
  disambiguation?: string | undefined;
  initialsColor?: Accent | undefined;
};

export type Team = {
  id: ID;
  name: string;
  personIds: ID[];
};

export type RoleAssignment = {
  id: ID;
  name: string;
  personIds: ID[];
  teamIds: ID[];
};

export type ChecklistItem = {
  id: ID;
  text: string;
};

export type BaseTask = {
  id: ID;
  title: string;
  category?: string | undefined;
  sortOrder: number;
  place?: string | undefined;
  notes?: string | undefined;
  personIds: ID[];
  teamIds: ID[];
  roles: RoleAssignment[];
  common: boolean;
  checklist: ChecklistItem[];
};

export type PointTask = BaseTask & { kind: 'point'; startsAt: ISOInstant };
export type IntervalTask = BaseTask & {
  kind: 'interval';
  startsAt: ISOInstant;
  endsAt: ISOInstant;
};
export type AfterTask = BaseTask & { kind: 'after'; afterTaskId: ID };
export type Task = PointTask | IntervalTask | AfterTask;

export type SharedDocument = {
  schemaVersion: 1;
  documentId: ID;
  organizationId: ID;
  revision: number;
  publishedAt: ISOInstant;
  event: {
    title: string;
    organization: string;
    startsAt: ISOInstant;
    endsAt: ISOInstant;
    timeZone: string;
    notes?: string | undefined;
    accent: Accent;
  };
  people: Person[];
  teams: Team[];
  tasks: Task[];
};

export type DocumentOrigin = 'author' | 'received' | 'duplicated' | 'demo';

export type StoredDocument = {
  document: SharedDocument;
  draft: SharedDocument | null;
  origin: DocumentOrigin;
  favorite: boolean;
  importedAt: ISOInstant | null;
  updatedAt: ISOInstant;
};

export type DocumentPreferences = {
  documentId: ID;
  mePersonId: ID | null;
  filter: 'all' | 'mine';
  includeCommon: boolean;
  followingPersonId: ID | null;
  liveMode: 'off' | 'all' | 'mine';
  liveIncludeCommon: boolean;
  reminderMode: 'off' | 'all' | 'mine';
  reminderIncludeCommon: boolean;
  reminderMinutes: null | 5 | 10 | 15;
};

export type AppPreferences = {
  theme: 'system' | 'light' | 'dark';
  selectedDocumentId: ID | null;
};

export type PersonalTaskState = {
  documentId: ID;
  taskId: ID;
  done: boolean;
  checkedItemIds: ID[];
};

export type EventStatus = 'upcoming' | 'active' | 'finished';
