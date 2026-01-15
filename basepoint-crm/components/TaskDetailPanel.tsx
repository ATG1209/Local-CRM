
import React, { useState, useEffect, useRef } from 'react';
import { Task, Company, Person } from '../types';
import SearchableSelect from './SearchableSelect';
import DatePickerPopover from './DatePickerPopover';
import RichTextEditor from './RichTextEditor';
import CompanyAvatar from './CompanyAvatar';
import {
  X,
  CheckCircle,
  Circle,
  Calendar,
  Briefcase,
  User as UserIcon,
  AlignLeft,
  Trash2
} from 'lucide-react';


interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  people: Person[];
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  isOpen,
  onClose,
  companies,
  people,
  onUpdate,
  onDelete
}) => {
  const [editForm, setEditForm] = useState<Task | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
        className={`fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-[60] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
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

              {/* Assignee */}
              <div className="grid grid-cols-[120px_1fr] items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <UserIcon size={16} className="text-gray-400" /> Assignee
                </div>
                <div className="w-[240px]">
                  <SearchableSelect
                    value={editForm.assignedTo}
                    onChange={(val) => updateField('assignedTo', val)}
                    options={userOptions}
                    className="border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded px-1 -ml-1"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div className="grid grid-cols-[120px_1fr] items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={16} className="text-gray-400" /> Due Date
                </div>
                <div className="relative w-[240px]" ref={dateTriggerRef}>
                  <div
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200 -ml-2 text-sm text-gray-900"
                  >
                    {editForm.dueDate ? (
                      <>
                        <span className={editForm.dueDate < new Date() && !editForm.isCompleted ? "text-red-600" : ""}>
                          {new Date(editForm.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {editForm.dueDate.getHours() !== 0 && (
                          <span className="text-xs text-gray-500">
                            {new Date(editForm.dueDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">Set due date...</span>
                    )}
                  </div>
                  <DatePickerPopover
                    isOpen={isDatePickerOpen}
                    date={editForm.dueDate ? new Date(editForm.dueDate) : null}
                    onChange={(d) => updateField('dueDate', d)}
                    onClose={() => setIsDatePickerOpen(false)}
                    triggerRef={dateTriggerRef}
                  />
                </div>
              </div>

              {/* Company */}
              <div className="grid grid-cols-[120px_1fr] items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Briefcase size={16} className="text-gray-400" /> Company
                </div>
                <div className="w-[240px]">
                  <SearchableSelect
                    value={editForm.linkedCompanyId}
                    onChange={(val) => updateField('linkedCompanyId', val)}
                    options={companyOptions}
                    className="border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded px-1 -ml-1"
                    placeholder="Add company..."
                  />
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
