
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
  pointOfContactId: string | null; // Relation to Person
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

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate: Date | null;
  linkedCompanyId?: string;
  assignedTo: string; // "You" or user ID
  createdBy: string; // "You" or user ID
  createdAt: Date;
  description?: string;
}

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
  | 'url';

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
}

export interface SavedView {
  id: string;
  name: string;
  type: 'table' | 'kanban';
  columns: ColumnDefinition[];
  sort?: { key: string; direction: 'asc' | 'desc' };
}

// --- Flexible Schema Types ---

export interface ObjectType {
  id: string;
  name: string;
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
}

export interface RecordRelation {
  id: string;
  sourceRecordId: string;
  targetRecordId: string;
  attributeId: string;
  createdAt?: string;
}
