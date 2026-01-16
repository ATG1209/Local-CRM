
import React, { useState, useEffect, useRef } from 'react';
import { Task, Company, Person } from '../types';
import SearchableSelect from './SearchableSelect';
import DatePickerPopover from './DatePickerPopover';
import RichTextEditor from './RichTextEditor';
import CompanyAvatar from './CompanyAvatar';
import {
  Trash2,
  CheckCircle,
  Circle,
  AlignLeft,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Settings,
  Calendar,
  Type,
  Link as LinkIcon,
  Layout,
  List,
  Hash,
  CheckSquare,
  Star as StarIcon,
  Clock,
  DollarSign,
  Activity,
  MapPin,
  Phone,
  Grid2X2,
  Mail,
  Linkedin,
  Plus
} from 'lucide-react';
import { ColumnDefinition, ColumnType } from '../types';
import RelationPicker from './RelationPicker';

const TypeIcon = ({ type }: { type: ColumnType }) => {
  switch (type) {
    case 'text': return <Type size={14} className="text-gray-400" />;
    case 'url': return <LinkIcon size={14} className="text-gray-400" />;
    case 'relation': return <Layout size={14} className="text-gray-400" />;
    case 'select': return <List size={14} className="text-gray-400" />;
    case 'date': return <Calendar size={14} className="text-gray-400" />;
    case 'number': return <Hash size={14} className="text-gray-400" />;
    case 'checkbox': return <CheckSquare size={14} className="text-gray-400" />;
    case 'rating': return <StarIcon size={14} className="text-gray-400" />;
    case 'timestamp': return <Clock size={14} className="text-gray-400" />;
    case 'currency': return <DollarSign size={14} className="text-gray-400" />;
    case 'status': return <Activity size={14} className="text-gray-400" />;
    case 'location': return <MapPin size={14} className="text-gray-400" />;
    case 'phone': return <Phone size={14} className="text-gray-400" />;
    case 'multi-select': return <Grid2X2 size={14} className="text-gray-400" />;
    default: return <Hash size={14} className="text-gray-400" />;
  }
};


interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  people: Person[];
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  // Dynamic props
  columns: ColumnDefinition[];
  onEditAttribute: (col: ColumnDefinition) => void;
  onAddProperty: () => void;
  onToggleVisibility?: (colId: string) => void;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  isOpen,
  onClose,
  companies,
  people,
  onUpdate,
  onDelete,
  columns,
  onEditAttribute,
  onAddProperty,
  onToggleVisibility
}) => {
  const [editForm, setEditForm] = useState<Task | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showHiddenProps, setShowHiddenProps] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const dateTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) {
      setEditForm(task);
    }
  }, [task]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const updateField = (field: keyof Task, value: any) => {
    if (editForm) {
      const updated = { ...editForm, [field]: value };
      setEditForm(updated);
      onUpdate(updated);
    }
  };

  if (!task || !editForm) return null;

  const companyOptions = companies.map(c => ({
    id: c.id,
    label: c.name,
    icon: <CompanyAvatar name={c.name} size="xs" />
  }));

  const userOptions = people.map(u => ({
    id: u.id,
    label: u.name,
    icon: <img src={u.avatar} className="w-4 h-4 rounded-full" alt="" />
  }));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[50]"
          onClick={onClose}
        />
      )}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 w-[520px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-[60] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateField('isCompleted', !editForm.isCompleted)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all ${editForm.isCompleted ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {editForm.isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
              <span className="text-sm font-medium">{editForm.isCompleted ? 'Completed' : 'Mark Complete'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onDelete(task.id); onClose(); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
            <div className="h-4 w-px bg-gray-200 mx-1"></div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Title (Rich Text) */}
            <div className="prose prose-lg max-w-none">
              <RichTextEditor
                singleLine
                variant="title"
                className="w-full text-2xl font-bold text-gray-900 border-none focus:ring-0 [&_a]:text-blue-600 [&_a]:underline"
                value={editForm.title}
                onChange={(val) => updateField('title', val)}
                placeholder="Task Title"
              />
            </div>

            {/* Properties */}
            <div className="space-y-4 pt-2">
              <div className="px-1 border-b border-gray-100 pb-6 mb-4">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 pl-1">Properties</h3>
                <div className="space-y-1">
                  {/* Detail Columns Map */}
                  {columns.filter(c =>
                    c.visible &&
                    c.id !== 'title' &&
                    c.id !== 'description' &&
                    c.id !== 'isCompleted'
                  ).map(col => (
                    <div key={col.id} className="group grid grid-cols-[140px_1fr_auto] items-start gap-2 py-1 min-h-[32px] hover:bg-gray-50 rounded px-1 -mx-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1.5 overflow-hidden">
                        <div className="p-1 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                          <TypeIcon type={col.type} />
                        </div>
                        <span className="truncate" title={col.label}>{col.label}</span>
                      </div>

                      <div className="relative min-w-0">
                        {/* Field Renderer */}
                        {(() => {
                          const value = (editForm as any)[col.accessorKey];

                          // Special handling for Task Fields
                          if (col.type === 'date' || col.accessorKey === 'dueDate') {
                            return (
                              <div className="relative w-full" ref={dateTriggerRef}>
                                <div
                                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-200 -ml-2 text-sm text-gray-900"
                                >
                                  {value ? (
                                    <>
                                      <span className={new Date(value) < new Date() && !editForm.isCompleted ? "text-red-600" : ""}>
                                        {new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                      {new Date(value).getHours() !== 0 && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-gray-400">Set due date...</span>
                                  )}
                                </div>
                                <DatePickerPopover
                                  isOpen={isDatePickerOpen}
                                  date={value ? new Date(value) : null}
                                  onChange={(d) => updateField(col.accessorKey as keyof Task, d)}
                                  onClose={() => setIsDatePickerOpen(false)}
                                  triggerRef={dateTriggerRef}
                                />
                              </div>
                            )
                          }

                          if (col.type === 'person' || col.accessorKey === 'assignedTo') {
                            return (
                              <div className="h-8">
                                <SearchableSelect
                                  value={value}
                                  onChange={(val) => updateField(col.accessorKey as keyof Task, val)}
                                  options={userOptions}
                                  className="border-transparent bg-transparent hover:bg-gray-50 -ml-2"
                                />
                              </div>
                            );
                          }

                          if (col.type === 'relation' || col.accessorKey === 'linkedCompanyId') {
                            return (
                              <div className="h-8">
                                <RelationPicker
                                  value={value}
                                  onChange={(newIds) => updateField(col.accessorKey as keyof Task, newIds[0] || null)}
                                  options={companyOptions}
                                  type="company"
                                  placeholder="Add company..."
                                />
                              </div>
                            );
                          }

                          // Default rendering for other generic properties
                          return (
                            <input
                              className="w-full text-sm px-2 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent rounded transition-all outline-none"
                              value={value || ''}
                              onChange={(e) => updateField(col.accessorKey as keyof Task, e.target.value)}
                              placeholder="Empty"
                            />
                          );
                        })()}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          className="cursor-pointer p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded"
                          onClick={(e) => { e.stopPropagation(); onEditAttribute(col); }}
                          title="Edit property"
                        >
                          <Settings size={12} />
                        </div>
                        {onToggleVisibility && (
                          <div
                            className="cursor-pointer p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded"
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(col.id); }}
                            title="Hide property"
                          >
                            <EyeOff size={12} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 cursor-pointer mt-4 pl-1 py-1"
                    onClick={onAddProperty}
                  >
                    <Plus size={12} /> Add property
                  </div>

                  {/* Hidden Properties Section */}
                  {columns.filter(c => !c.visible && c.id !== 'title' && c.id !== 'description' && c.id !== 'isCompleted').length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div
                        className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 mb-2"
                        onClick={() => setShowHiddenProps(!showHiddenProps)}
                      >
                        {showHiddenProps ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        {columns.filter(c => !c.visible && c.id !== 'title' && c.id !== 'description' && c.id !== 'isCompleted').length} Hidden properties
                      </div>

                      {showHiddenProps && (
                        <div className="space-y-1">
                          {columns.filter(c => !c.visible && c.id !== 'title' && c.id !== 'description' && c.id !== 'isCompleted').map(col => (
                            <div key={col.id} className="group grid grid-cols-[140px_1fr_auto] items-start gap-2 py-1 min-h-[32px] hover:bg-gray-50 rounded px-1 -mx-1 opacity-70 hover:opacity-100">
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1.5 overflow-hidden">
                                <div className="p-1 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                                  <TypeIcon type={col.type} />
                                </div>
                                <span className="truncate" title={col.label}>{col.label}</span>
                              </div>
                              <div className="relative min-w-0 pointer-events-none grayscale opacity-60">
                                {/* Simple placeholder for hidden view */}
                                <div className="text-sm text-gray-400 py-1.5 px-2">
                                  {(editForm as any)[col.accessorKey] ? String((editForm as any)[col.accessorKey]) : 'Empty'}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div
                                  className="cursor-pointer p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded"
                                  onClick={(e) => { e.stopPropagation(); onEditAttribute(col); }}
                                  title="Edit property"
                                >
                                  <Settings size={12} />
                                </div>
                                {onToggleVisibility && (
                                  <div
                                    className="cursor-pointer p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded"
                                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(col.id); }}
                                    title="Show property"
                                  >
                                    <Eye size={12} />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6"></div>

            {/* Description (Rich Text) */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                <AlignLeft size={16} className="text-gray-500" /> Description
              </div>
              <div className="relative">
                <div className="w-full min-h-[200px] p-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <RichTextEditor
                    variant="description"
                    className="min-h-[190px] outline-none [&_a]:text-blue-600 [&_a]:underline"
                    placeholder="Add details... (Paste URL over text to link)"
                    value={editForm.description || ''}
                    onChange={(val) => updateField('description', val)}
                  />
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
                  Cmd+Click to open links
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetailPanel;
