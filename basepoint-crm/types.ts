
export type ViewState =
  | 'companies'
  | 'deals'
  | 'reports'
  | 'workflows'
  | 'notifications'
  | 'tasks'
  | 'emails'
  | 'sequences'
  | 'people'
  | 'workspaces'
  | 'partnerships';

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  domain: string;

  // New specific fields
  links: { label: string; url: string }[];
  specialOffers: string[]; // Multi-select
  pointOfContactId: string[]; // Relation to People (supports multiple contacts)
  notes: string;
  nextTaskDate: string | null; // "Due date" from tasks
  externalId: string; // External CID
  loggingStage: string[]; // Multi-select
  groundControl: string[]; // Multi-select
  sensitiveVertical: boolean;
  quarters: string; // Select
  nal: boolean; // True/False
  createdAt: string; // ISO String
}

export interface Person {
  id: string;
  name: string;
  email: string;
  avatar: string;
  companyId: string;
  role: string;
  description?: string; // New field
  // Extended fields
  phone?: string;
  location?: string;
  linkedIn?: string;
  createdAt: string;
  lastInteraction?: string;
  connectionStrength?: 'Strong' | 'Moderate' | 'Weak' | 'None';
  tags?: string[];
}

export interface Deal {
  id: string;
  companyName: string;
  companyLogo: string;
  ownerName: string;
  ownerAvatar: string;
  value: number;
  stage: 'Lead' | 'Contacted' | 'Qualification' | 'Evaluation';
  tags: string[];
  lastActivity: string;
  comments: number;
  tasks: number;
}

export interface MetricData {
  name: string;
  uv: number;
  pv: number;
  amt: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  color: string;
}

export interface WorkflowRun {
  id: number;
  status: 'Completed' | 'Executing' | 'Failed';
  time: string;
  credits: number;
}

// --- Activity System (Unified task/email/call/meeting) ---

export type ActivityType = 'task' | 'call' | 'meeting';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate: Date | null;
  linkedCompanyId?: string;
  linkedPersonId?: string;  // NEW: Support linking to people
  assignedTo: string;
  createdBy: string;
  createdAt: Date;
}

// Backward compatibility alias
export type { Activity as Task };

export interface ActivityTypeConfig {
  type: ActivityType;
  label: string;
  icon: string;  // Lucide icon name
  color: string; // Tailwind color base (e.g., 'blue', 'purple')
  defaultDuration?: number; // in minutes
}

export const ACTIVITY_TYPE_CONFIGS: Record<ActivityType, ActivityTypeConfig> = {
  task: {
    type: 'task',
    label: 'Task',
    icon: 'CheckSquare',
    color: 'blue'
  },

  call: {
    type: 'call',
    label: 'Call',
    icon: 'Phone',
    color: 'green',
    defaultDuration: 30
  },
  meeting: {
    type: 'meeting',
    label: 'Meeting',
    icon: 'Calendar',
    color: 'purple',
    defaultDuration: 60
  }
};

// --- View System Types ---

export type ColumnType =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'date'
  | 'rating'
  | 'timestamp'
  | 'select'
  | 'multi-select'
  | 'currency'
  | 'record'
  | 'user'
  | 'status'
  | 'relation'
  | 'location'
  | 'phone'
  | 'email'
  | 'company'
  | 'person'
  | 'url'
  | 'link';

export interface AttributeOption {
  id: string;
  label: string;
  color: string;
}

export interface ColumnDefinition {
  id: string;
  label: string;
  type: ColumnType;
  accessorKey: string; // Dot notation supported e.g. "company.name"
  width?: number;
  visible: boolean;
  isSystem?: boolean; // Cannot be removed
  readonly?: boolean; // Cannot be edited directly
  options?: AttributeOption[]; // For select/multi-select
  description?: string;
  config?: AttributeConfig; // Full config for link abbreviation, relation target, etc.
}

export interface SortRule {
  key: string;
  direction: 'asc' | 'desc';
}

export type SortConfig = SortRule[];

export type FilterOperator =
  | 'contains'
  | 'not_contains'
  | 'is'
  | 'is_not'
  | 'is_empty'
  | 'is_not_empty'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'before'
  | 'after'
  | 'on'
  | 'on_or_before'
  | 'on_or_after';

export interface FilterRule {
  id: string;
  columnId: string;
  operator: FilterOperator;
  value?: string | number | boolean | null;
}

export interface KanbanConfig {
  groupByAttributeId: string;     // select/status attribute for columns
  cardFields?: string[];          // attribute IDs to show on cards
  showColumnCounts?: boolean;
  showColumnSums?: string;        // attribute ID for sum (e.g., 'value')
}

// Column preferences stored in views (subset of ColumnDefinition for persistence)
export interface ColumnPreference {
  id: string;
  visible: boolean;
  width?: number;
}

export interface SavedView {
  id: string;
  name: string;
  objectId: string;               // Link view to specific object/database
  type: 'table' | 'kanban';
  columns: ColumnPreference[];    // Only stores preferences, full definitions come from schema
  sort?: SortRule[];
  filters?: FilterRule[];
  kanbanConfig?: KanbanConfig;    // Kanban-specific settings
  isDefault?: boolean;            // Mark default view per object
  isFavorite?: boolean;           // Show in sidebar favorites
}

// --- Flexible Schema Types ---

export interface ObjectType {
  id: string;
  name: string;
  singularName?: string;
  description?: string;
  slug: string;
  icon: string;
  isSystem: boolean;
  createdAt?: string;
}

export interface Attribute {
  id: string;
  objectId: string;
  name: string;
  type: ColumnType;
  config: AttributeConfig;
  isSystem: boolean;
  position: number;
  createdAt?: string;
}

export interface AttributeConfig {
  options?: AttributeOption[];       // For select/multi-select
  targetObjectId?: string;           // For relations
  reverseAttributeId?: string;       // For bidirectional relations
  cardinality?: 'one' | 'many';      // one-to-one vs one-to-many
  rollupAttributeId?: string;        // For rollups
  rollupFunction?: 'count' | 'first' | 'last' | 'sum' | 'avg' | 'min' | 'max';
  abbreviation?: string;             // For link type - short display name (e.g., "GA")
}

export interface RecordRelation {
  id: string;
  sourceRecordId: string;
  targetRecordId: string;
  attributeId: string;
  createdAt?: string;
}

export const ACTIVITY_COLUMNS: ColumnDefinition[] = [
  { id: 'type', label: 'Type', type: 'select', accessorKey: 'type', visible: true, width: 120 },
  { id: 'isCompleted', label: 'Done', type: 'checkbox', accessorKey: 'isCompleted', visible: true, width: 40 },
  { id: 'title', label: 'Activity', type: 'text', accessorKey: 'title', visible: true, isSystem: true, width: 300 },
  { id: 'due', label: 'Due Date', type: 'date', accessorKey: 'dueDate', visible: true, width: 160 },
  { id: 'company', label: 'Company', type: 'relation', accessorKey: 'linkedCompanyId', visible: true, width: 200 },
  { id: 'person', label: 'Person', type: 'relation', accessorKey: 'linkedPersonId', visible: true, width: 200 },
  { id: 'assignee', label: 'Assignee', type: 'person', accessorKey: 'assignedTo', visible: true, width: 180 },
];
