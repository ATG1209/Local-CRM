import React, { useState, useEffect, useRef } from 'react';
import { ACTIVITY_COLUMNS, ViewState, Company, Activity, Person, SavedView, ColumnDefinition, ColumnType } from '../types';
import SearchableSelect from './SearchableSelect';
import CompanyAvatar from './CompanyAvatar';
import ActivityTimeline from './ActivityTimeline';
import TaskDetailPanel from './TaskDetailPanel';
import {
   X,
   Globe,
   Edit2,
   Save,
   Link as LinkIcon,
   MessageSquare,
   Plus,
   Settings,
   Type,
   Calendar,
   Hash,
   CheckSquare,
   Star,
   Clock,
   DollarSign,
   Activity as ActivityIcon,
   MapPin,
   Phone,
   Layout,
   List,
   Grid2X2,
   User,
   Mail,
   Linkedin,
   Briefcase,
   Eye,
   EyeOff,
   ChevronDown,
   ChevronRight
} from 'lucide-react';
import RelationPicker from './RelationPicker';

interface PersonDetailPanelProps {
   person: Person | null;
   isOpen: boolean;
   onClose: () => void;
   companies: Company[];
   activities: Activity[];
   onUpdate: (person: Person) => void;
   // Dynamic props
   people?: Person[]; // For relations if needed
   columns: ColumnDefinition[];
   onEditAttribute: (col: ColumnDefinition) => void;
   onAddProperty: () => void;
   onToggleVisibility?: (colId: string) => void;
   onOpenActivityModal?: (personId: string) => void;
   onUpdateActivity: (activity: Activity) => void;
   onDeleteActivity: (id: string) => void;
}

const TypeIcon = ({ type }: { type: ColumnType }) => {
   switch (type) {
      case 'text': return <Type size={14} className="text-gray-400" />;
      case 'url': return <LinkIcon size={14} className="text-gray-400" />;
      case 'relation': return <Layout size={14} className="text-gray-400" />;
      case 'select': return <List size={14} className="text-gray-400" />;
      case 'date': return <Calendar size={14} className="text-gray-400" />;
      case 'number': return <Hash size={14} className="text-gray-400" />;
      case 'checkbox': return <CheckSquare size={14} className="text-gray-400" />;
      case 'rating': return <Star size={14} className="text-gray-400" />;
      case 'timestamp': return <Clock size={14} className="text-gray-400" />;
      case 'currency': return <DollarSign size={14} className="text-gray-400" />;
      case 'status': return <ActivityIcon size={14} className="text-gray-400" />;
      case 'location': return <MapPin size={14} className="text-gray-400" />;
      case 'phone': return <Phone size={14} className="text-gray-400" />;
      case 'multi-select': return <Grid2X2 size={14} className="text-gray-400" />;
      default: return <Hash size={14} className="text-gray-400" />;
   }
};

const PersonDetailPanel: React.FC<PersonDetailPanelProps> = ({
   person,
   isOpen,
   onClose,
   companies,
   activities,
   onUpdate,
   people,
   columns,
   onEditAttribute,
   onAddProperty,
   onToggleVisibility,
   onOpenActivityModal,
   onUpdateActivity,
   onDeleteActivity
}) => {
   const [editForm, setEditForm] = useState<Person | null>(null);
   const panelRef = useRef<HTMLDivElement>(null);
   const [editingHeader, setEditingHeader] = useState(false);
   const [showHiddenProps, setShowHiddenProps] = useState(false);
   const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

   useEffect(() => {
      if (person) {
         setEditForm(person);
         setEditingHeader(false);
      }
   }, [person]);

   // Handle Escape key to close the panel (unless nested panel is handled first)
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isOpen && !editingActivity) {
            e.stopPropagation();
            e.preventDefault();
            onClose();
         }
      };

      if (isOpen) {
         // Use capture phase to handle before parent panels
         window.addEventListener('keydown', handleKeyDown, true);
      }

      return () => {
         window.removeEventListener('keydown', handleKeyDown, true);
      };
   }, [isOpen, onClose, editingActivity]);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
            onClose();
         }
      };
      const timeout = setTimeout(() => {
         document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
         clearTimeout(timeout);
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, [isOpen, onClose]);


   if (!person || !editForm) return null;

   const handleUpdateField = (field: string, value: any) => {
      if (editForm) {
         const updated = { ...editForm, [field]: value };
         setEditForm(updated);
         onUpdate(updated);
      }
   };

   const companyOptions = companies.map(c => ({
      id: c.id,
      label: c.name,
      icon: <CompanyAvatar name={c.name} size="xs" />
   }));

   const inputClass = "w-full text-sm px-0 py-1 border border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent rounded transition-all outline-none";

   const renderFieldInput = (col: ColumnDefinition) => {
      const value = (editForm as any)[col.accessorKey];

      if (col.readonly) {
         return (
            <div className="text-sm text-gray-500 py-1 transition-all">
               {col.type === 'timestamp' || col.type === 'date'
                  ? (value ? new Date(value).toLocaleDateString() : '-')
                  : (typeof value === 'object' && value !== null ? '-' : (value || '-'))}
            </div>
         );
      }

      // Hardcoded mapping for legacy companyId to Select/Relation
      if (col.accessorKey === 'companyId') {
         return (
            <div className="h-8 flex items-center">
               <RelationPicker
                  value={value}
                  onChange={(newIds) => handleUpdateField(col.accessorKey, newIds[0] || null)} // Legacy single select
                  options={companyOptions}
                  type="company"
                  placeholder="Select company..."
               />
            </div>
         );
      }

      switch (col.type) {
         case 'select':
         case 'multi-select':
            if (col.options && col.options.length > 0) {
               return (
                  <div className="h-8 flex items-center">
                     <SearchableSelect
                        value={Array.isArray(value) ? value[0] : value}
                        onChange={(val) => handleUpdateField(col.accessorKey, col.type === 'multi-select' ? [val] : val)}
                        options={col.options.map(opt => ({
                           id: opt.id,
                           label: opt.label,
                           icon: <div className={`w-3 h-3 rounded-full ${opt.color.split(' ')[0]}`}></div>
                        }))}
                        className="border-transparent bg-transparent hover:bg-gray-50"
                     />
                  </div>
               );
            }
            return (
               <input
                  className={inputClass}
                  value={Array.isArray(value) ? value.join(', ') : (value || '')}
                  onChange={(e) => {
                     const val = e.target.value;
                     handleUpdateField(col.accessorKey, col.type === 'multi-select' ? val.split(', ') : val);
                  }}
                  placeholder="Select..."
               />
            );
         case 'date':
            return (
               <input
                  type="date"
                  className={inputClass}
                  value={(() => {
                     if (!value) return '';
                     try {
                        const d = new Date(value);
                        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
                     } catch { return ''; }
                  })()}
                  onChange={(e) => handleUpdateField(col.accessorKey, e.target.value)}
               />
            );
         case 'checkbox':
            return (
               <div className="h-8 flex items-center">
                  <input
                     type="checkbox"
                     checked={!!value}
                     onChange={(e) => handleUpdateField(col.accessorKey, e.target.checked)}
                     className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
               </div>
            );
         case 'rating':
            return (
               <div className="flex items-center gap-1 h-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                     <Star
                        key={star}
                        size={14}
                        className={`cursor-pointer ${star <= (value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                        onClick={() => handleUpdateField(col.accessorKey, star)}
                     />
                  ))}
               </div>
            );
         default:
            if (col.id === 'description' || col.accessorKey === 'description') {
               return (
                  <textarea
                     className={`${inputClass} min-h-[80px] py-2 resize-none`}
                     value={value || ''}
                     onChange={(e) => handleUpdateField(col.accessorKey, e.target.value)}
                     placeholder="Add notes..."
                  />
               )
            }
            return (
               <input
                  className={inputClass}
                  value={value || ''}
                  onChange={(e) => handleUpdateField(col.accessorKey, e.target.value)}
                  placeholder="Empty"
                  type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
               />
            );
      }
   };

   // Filter out columns we show in the header explicitly
   const detailColumns = columns.filter(c => c.id !== 'name' && c.id !== 'role' && c.visible);

   // Calculate hidden columns
   const hiddenColumns = columns.filter(c => c.id !== 'name' && c.id !== 'role' && !c.visible);

   return (
      <>
         {isOpen && (
            <div
               className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[50]"
               onClick={onClose}
            />
         )}
         <div className={`fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-[60] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} ref={panelRef}>
            {/* Compact Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/30">
               <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0 group">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 font-bold shadow-sm text-xs">
                        {person.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                     </div>
                  </div>
                  <div className="flex-1 min-w-0">
                     {editingHeader ? (
                        <input
                           autoFocus
                           className="text-lg font-bold text-gray-900 bg-white border border-blue-500 rounded px-1.5 py-0.5 outline-none w-full shadow-sm"
                           value={editForm.name}
                           onChange={(e) => handleUpdateField('name', e.target.value)}
                           onBlur={() => setEditingHeader(false)}
                           onKeyDown={(e) => e.key === 'Enter' && setEditingHeader(false)}
                        />
                     ) : (
                        <h2
                           className="text-lg font-bold text-gray-900 truncate cursor-pointer hover:text-gray-600 flex items-center gap-2 group"
                           onClick={() => setEditingHeader(true)}
                        >
                           {editForm.name}
                           <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                        </h2>
                     )}
                     <div className="flex items-center gap-2 mt-0.5">
                        <input
                           className="bg-transparent border-none outline-none text-xs text-gray-500 hover:text-gray-800 p-0 w-auto truncate focus:ring-0 placeholder:text-gray-300"
                           value={editForm.role}
                           onChange={(e) => handleUpdateField('role', e.target.value)}
                           placeholder="Add role..."
                        />
                     </div>
                  </div>
               </div>
               <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded ml-2">
                  <X size={18} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto">
               {/* Quick Actions / Contact Info */}
               <div className="px-5 py-4 border-b border-gray-100 flex gap-2">
                  <button
                     className="flex-1 flex items-center justify-center gap-2 py-1.5 border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                     onClick={() => window.location.href = `mailto:${person.email}`}
                  >
                     <Mail size={14} /> Email
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-1.5 border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                     <Phone size={14} /> Call
                  </button>
                  {person.linkedIn && (
                     <button
                        className="flex-1 flex items-center justify-center gap-2 py-1.5 border border-gray-200 rounded text-xs font-medium text-[#0077b5] hover:bg-[#ebf4fa] border-[#0077b5]/20 transition-colors"
                        onClick={() => window.open(person.linkedIn, '_blank')}
                     >
                        <Linkedin size={14} /> LinkedIn
                     </button>
                  )}
               </div>

               {/* Dynamic Properties Grid */}
               <div className="px-5 py-6 border-b border-gray-100">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 pl-1">Properties</h3>
                  <div className="space-y-1">
                     {detailColumns.map(col => (
                        <div key={col.id} className="group grid grid-cols-[140px_1fr_auto] items-start gap-3 py-1 min-h-[32px] hover:bg-gray-50 rounded px-1 -mx-1">
                           <div className="flex items-center gap-2 text-sm text-gray-500 min-h-[32px] overflow-hidden">
                              <div className="p-1 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                                 <TypeIcon type={col.type} />
                              </div>
                              <span className="truncate" title={col.label}>{col.label}</span>
                           </div>
                           <div className="relative min-w-0">
                              {renderFieldInput(col)}
                           </div>

                           {/* Action buttons - Settings & Hide */}
                           <div className="flex items-center gap-0.5 min-h-[32px] opacity-0 group-hover:opacity-100 transition-opacity">
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
                     {hiddenColumns.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                           <div
                              className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 mb-2"
                              onClick={() => setShowHiddenProps(!showHiddenProps)}
                           >
                              {showHiddenProps ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              {hiddenColumns.length} Hidden properties
                           </div>

                           {showHiddenProps && (
                              <div className="space-y-1">
                                 {hiddenColumns.map(col => (
                                    <div key={col.id} className="group grid grid-cols-[140px_1fr_auto] items-start gap-4 py-1 min-h-[32px] hover:bg-gray-50 rounded px-1 -mx-1 opacity-70 hover:opacity-100">
                                       <div className="flex items-center gap-2 text-sm text-gray-500 min-h-[32px] overflow-hidden">
                                          <div className="p-1 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                                             <TypeIcon type={col.type} />
                                          </div>
                                          <span className="truncate" title={col.label}>{col.label}</span>
                                       </div>
                                       <div className="relative min-w-0 pointer-events-none grayscale opacity-60">
                                          {renderFieldInput(col)}
                                       </div>

                                       {/* Action buttons */}
                                       <div className="flex items-center gap-0.5 min-h-[32px] opacity-0 group-hover:opacity-100 transition-opacity">
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

               {/* Timeline Section */}
               <div className="py-6">
                  <div className="flex items-center justify-between mb-4 px-5">
                     <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Timeline</h3>
                     {onOpenActivityModal && person && (
                        <button
                           onClick={() => onOpenActivityModal(person.id)}
                           className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                           + Log activity
                        </button>
                     )}
                  </div>
                  <ActivityTimeline
                     activities={activities.filter(a => a.linkedPersonId === person?.id)}
                     companies={companies}
                     people={[]}
                     showCompanyLinks={true}
                     onOpenActivity={(a) => setEditingActivity(a)}
                  />
               </div>
            </div>

            {/* Activity Detail Panel (Nested) */}
            <TaskDetailPanel
               task={editingActivity}
               isOpen={!!editingActivity}
               onClose={() => setEditingActivity(null)}
               companies={companies}
               people={people || []}
               onUpdate={onUpdateActivity}
               onDelete={onDeleteActivity}
               columns={ACTIVITY_COLUMNS}
               onEditAttribute={() => { }}
               onAddProperty={() => { }}
            />
         </div>
      </>
   );
};

export default PersonDetailPanel;
