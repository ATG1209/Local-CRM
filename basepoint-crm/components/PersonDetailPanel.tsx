import React, { useState, useEffect, useRef } from 'react';
import { Person, Company, ColumnDefinition, ColumnType } from '../types';
import SearchableSelect from './SearchableSelect';
import CompanyAvatar from './CompanyAvatar';
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
   Activity,
   MapPin,
   Phone,
   Layout,
   List,
   Grid2X2,
   User,
   Mail,
   Linkedin,
   Briefcase
} from 'lucide-react';

interface PersonDetailPanelProps {
   person: Person | null;
   isOpen: boolean;
   onClose: () => void;
   companies: Company[];
   onUpdate: (person: Person) => void;
   // Dynamic props
   people?: Person[]; // For relations if needed
   columns: ColumnDefinition[];
   onEditAttribute: (col: ColumnDefinition) => void;
   onAddProperty: () => void;
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
      case 'status': return <Activity size={14} className="text-gray-400" />;
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
   onUpdate,
   columns,
   onEditAttribute,
   onAddProperty
}) => {
   const [editForm, setEditForm] = useState<Person | null>(null);
   const panelRef = useRef<HTMLDivElement>(null);
   const [editingHeader, setEditingHeader] = useState(false);

   useEffect(() => {
      if (person) {
         setEditForm(person);
         setEditingHeader(false);
      }
   }, [person]);

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

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
            if (isOpen) onClose();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
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

   const inputClass = "w-full text-sm px-2 py-1 border border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-transparent rounded transition-all outline-none";

   const renderFieldInput = (col: ColumnDefinition) => {
      const value = (editForm as any)[col.accessorKey];

      if (col.readonly) {
         return (
            <div className="text-sm text-gray-500 py-1">
               {col.type === 'timestamp' || col.type === 'date'
                  ? (value ? new Date(value).toLocaleDateString() : '-')
                  : (value || '-')}
            </div>
         );
      }

      // Hardcoded mapping for legacy companyId to Select/Relation
      if (col.accessorKey === 'companyId') {
         return (
            <div className="h-8">
               <SearchableSelect
                  value={value}
                  onChange={(val) => handleUpdateField(col.accessorKey, val)}
                  options={companyOptions}
                  className="border-transparent bg-transparent hover:bg-gray-50 -ml-2"
               />
            </div>
         );
      }

      switch (col.type) {
         case 'select':
         case 'multi-select':
            if (col.options && col.options.length > 0) {
               return (
                  <div className="h-8">
                     <SearchableSelect
                        value={Array.isArray(value) ? value[0] : value}
                        onChange={(val) => handleUpdateField(col.accessorKey, col.type === 'multi-select' ? [val] : val)}
                        options={col.options.map(opt => ({
                           id: opt.id,
                           label: opt.label,
                           icon: <div className={`w-3 h-3 rounded-full ${opt.color.split(' ')[0]}`}></div>
                        }))}
                        className="border-transparent bg-transparent hover:bg-gray-50 -ml-2"
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
                  value={value ? new Date(value).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdateField(col.accessorKey, e.target.value)}
               />
            );
         case 'checkbox':
            return (
               <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => handleUpdateField(col.accessorKey, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer mt-1.5"
               />
            );
         case 'rating':
            return (
               <div className="flex items-center gap-1 py-1">
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
                     className={`${inputClass} min-h-[80px] resize-none`}
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

   return (
      <div className={`fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-[60] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} ref={panelRef}>
         {/* Compact Header */}
         <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/30">
            <div className="flex items-center gap-3 flex-1 min-w-0">
               <div className="relative flex-shrink-0 group">
                  {person.avatar ? (
                     <img src={person.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-gray-200" alt="" />
                  ) : (
                     <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shadow-sm ring-1 ring-gray-200">
                        <User size={20} />
                     </div>
                  )}
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
                     <div key={col.id} className="group grid grid-cols-[140px_1fr] items-start gap-2 py-1 min-h-[32px] hover:bg-gray-50 rounded px-1 -mx-1 relative">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1.5 overflow-hidden">
                           <div className="p-1 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                              <TypeIcon type={col.type} />
                           </div>
                           <span className="truncate" title={col.label}>{col.label}</span>
                        </div>
                        <div className="relative min-w-0">
                           {renderFieldInput(col)}
                        </div>

                        {/* Property Settings Trigger */}
                        <div
                           className="absolute left-0 top-1.5 -ml-6 opacity-0 group-hover:opacity-100 cursor-pointer p-1 text-gray-300 hover:text-gray-600 transition-opacity"
                           onClick={(e) => { e.stopPropagation(); onEditAttribute(col); }}
                           title="Edit property"
                        >
                           <Settings size={12} />
                        </div>
                     </div>
                  ))}

                  <div
                     className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 cursor-pointer mt-4 pl-1 py-1"
                     onClick={onAddProperty}
                  >
                     <Plus size={12} /> Add property
                  </div>
               </div>
            </div>

            {/* Activity Section Placeholder */}
            <div className="px-5 py-6">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Timeline</h3>
               </div>

               {/* Simple timeline mimicking previous implementation but cleaner */}
               <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-0 before:w-px before:bg-gray-200">
                  {person.lastInteraction && (
                     <div className="relative pl-6">
                        <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></div>
                        <div className="text-sm font-medium text-gray-900">Interaction</div>
                        <div className="text-xs text-gray-500">{person.lastInteraction}</div>
                     </div>
                  )}
                  <div className="relative pl-6">
                     <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-white"></div>
                     <div className="text-sm font-medium text-gray-900">Created</div>
                     <div className="text-xs text-gray-500">{new Date(person.createdAt).toLocaleDateString()}</div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default PersonDetailPanel;
