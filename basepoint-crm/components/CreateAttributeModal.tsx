import React, { useState, useEffect } from 'react';
import {
   Type,
   Hash,
   CheckSquare,
   Calendar,
   Star,
   Clock,
   List,
   Check,
   DollarSign,
   User,
   Activity,
   Layout,
   MapPin,
   Phone,
   X,
   Globe,
   Plus,
   Trash2
} from 'lucide-react';
import { ColumnType, AttributeOption } from '../types';
import { fetchObjects, ObjectType } from '../utils/schemaApi';

interface CreateAttributeModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSave: (data: any) => void; // partial Attribute data
   initialData?: any | null; // Attribute or ColumnDefinition
}

const ATTRIBUTE_TYPES: { type: ColumnType; label: string; icon: React.ReactNode }[] = [
   { type: 'text', label: 'Text', icon: <Type size={16} /> },
   { type: 'number', label: 'Number', icon: <Hash size={16} /> },
   { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare size={16} /> },
   { type: 'date', label: 'Date', icon: <Calendar size={16} /> },
   { type: 'rating', label: 'Rating', icon: <Star size={16} /> },
   { type: 'timestamp', label: 'Timestamp', icon: <Clock size={16} /> },
   { type: 'select', label: 'Select', icon: <List size={16} /> },
   { type: 'multi-select', label: 'Multi-select', icon: <Check size={16} /> },
   { type: 'currency', label: 'Currency', icon: <DollarSign size={16} /> },
   { type: 'user', label: 'User', icon: <User size={16} /> },
   { type: 'status', label: 'Status', icon: <Activity size={16} /> },
   { type: 'relation', label: 'Relation', icon: <Layout size={16} /> },
   { type: 'location', label: 'Location', icon: <MapPin size={16} /> },
   { type: 'phone', label: 'Phone Number', icon: <Phone size={16} /> },
   { type: 'url', label: 'URL', icon: <Globe size={16} /> },
];

const TAG_COLORS = [
   'bg-red-100 text-red-700',
   'bg-orange-100 text-orange-700',
   'bg-amber-100 text-amber-700',
   'bg-yellow-100 text-yellow-700',
   'bg-lime-100 text-lime-700',
   'bg-green-100 text-green-700',
   'bg-emerald-100 text-emerald-700',
   'bg-teal-100 text-teal-700',
   'bg-cyan-100 text-cyan-700',
   'bg-sky-100 text-sky-700',
   'bg-blue-100 text-blue-700',
   'bg-indigo-100 text-indigo-700',
   'bg-violet-100 text-violet-700',
   'bg-purple-100 text-purple-700',
   'bg-fuchsia-100 text-fuchsia-700',
   'bg-pink-100 text-pink-700',
   'bg-rose-100 text-rose-700',
];

const CreateAttributeModal: React.FC<CreateAttributeModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
   const [name, setName] = useState('');
   const [selectedType, setSelectedType] = useState<ColumnType | null>(null);
   const [description, setDescription] = useState('');
   const [options, setOptions] = useState<AttributeOption[]>([]);
   const [newOptionLabel, setNewOptionLabel] = useState('');

   // Relation specific state
   const [availableObjects, setAvailableObjects] = useState<ObjectType[]>([]);
   const [targetObjectId, setTargetObjectId] = useState<string>('');

   useEffect(() => {
      if (isOpen) {
         fetchObjects().then(setAvailableObjects).catch(console.error);
      }
   }, [isOpen]);

   useEffect(() => {
      if (initialData) {
         setName(initialData.name || initialData.label);
         setSelectedType(initialData.type);
         setDescription(initialData.description || '');
         setOptions(initialData.config?.options || initialData.options || []);
         setTargetObjectId(initialData.config?.targetObjectId || '');
      } else {
         setName('');
         setSelectedType(null);
         setDescription('');
         setOptions([]);
         setTargetObjectId('');
      }
      setNewOptionLabel('');
   }, [initialData, isOpen]);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isOpen) {
            onClose();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, onClose]);

   if (!isOpen) return null;

   const handleSubmit = () => {
      if (name && selectedType) {
         const attributeData = {
            id: initialData?.id,
            name,
            type: selectedType,
            description,
            config: {
               options: (selectedType === 'select' || selectedType === 'multi-select') ? options : undefined,
               targetObjectId: selectedType === 'relation' ? targetObjectId : undefined,
               cardinality: selectedType === 'relation' ? 'many' : undefined // Default to many-to-many
            }
         };
         onSave(attributeData);
         onClose();
      }
   };

   const handleAddOption = () => {
      if (!newOptionLabel.trim()) return;
      const randomColor = TAG_COLORS[options.length % TAG_COLORS.length];
      setOptions([...options, {
         id: Math.random().toString(36).substr(2, 9),
         label: newOptionLabel.trim(),
         color: randomColor
      }]);
      setNewOptionLabel('');
   };

   const handleRemoveOption = (id: string) => {
      setOptions(options.filter(o => o.id !== id));
   };

   const handleOptionKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
         e.preventDefault();
         handleAddOption();
      }
   };

   return (
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-100">
         <div className="bg-white rounded-xl shadow-2xl w-[600px] flex flex-col max-h-[90vh] overflow-hidden border border-gray-200">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
               <h2 className="text-lg font-semibold text-gray-900">{initialData ? 'Edit attribute' : 'Create new attribute'}</h2>
               <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
               <div className="space-y-6">
                  {/* Type Selection */}
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                     {!initialData ? (
                        <div className="grid grid-cols-2 gap-2">
                           {ATTRIBUTE_TYPES.map(attr => (
                              <div
                                 key={attr.type}
                                 onClick={() => setSelectedType(attr.type)}
                                 className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all bg-white ${selectedType === attr.type ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                              >
                                 <div className={`p-1.5 rounded ${selectedType === attr.type ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {attr.icon}
                                 </div>
                                 <span className={`text-sm font-medium ${selectedType === attr.type ? 'text-blue-700' : 'text-gray-700'}`}>{attr.label}</span>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed">
                           <div className="p-1.5 rounded bg-gray-200 text-gray-500">
                              {ATTRIBUTE_TYPES.find(t => t.type === initialData.type)?.icon}
                           </div>
                           <span className="text-sm font-medium text-gray-700">{ATTRIBUTE_TYPES.find(t => t.type === initialData.type)?.label}</span>
                           <span className="ml-auto text-xs text-gray-400">Type cannot be changed</span>
                        </div>
                     )}
                  </div>

                  {/* Name */}
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                     <input
                        autoFocus={!initialData}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
                        placeholder="e.g. Project Status"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                     />
                  </div>

                  {/* Relation Configuration */}
                  {selectedType === 'relation' && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Link to</label>
                        <select
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-gray-900 shadow-sm appearance-none"
                           value={targetObjectId}
                           onChange={(e) => setTargetObjectId(e.target.value)}
                           disabled={!!initialData} // Cannot change target of existing relation
                        >
                           <option value="">Select a database...</option>
                           {availableObjects.map(obj => (
                              <option key={obj.id} value={obj.id}>{obj.name}</option>
                           ))}
                        </select>
                        <p className="mt-1.5 text-xs text-gray-500">Select which database you want to link records from.</p>
                     </div>
                  )}

                  {/* Description */}
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                     <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-gray-900 placeholder:text-gray-400 shadow-sm resize-none h-20"
                        placeholder="Add a description for this attribute..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                     />
                  </div>

                  {/* Options (Only for Select/Multi-select) */}
                  {(selectedType === 'select' || selectedType === 'multi-select') && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                        <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/50">
                           <div className="flex flex-wrap gap-2">
                              {options.map((option) => (
                                 <div key={option.id} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border border-transparent ${option.color} group`}>
                                    {option.label}
                                    <button onClick={() => handleRemoveOption(option.id)} className="hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <X size={12} />
                                    </button>
                                 </div>
                              ))}
                           </div>
                           <div className="flex gap-2">
                              <input
                                 className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                 placeholder="Type an option and press Enter..."
                                 value={newOptionLabel}
                                 onChange={(e) => setNewOptionLabel(e.target.value)}
                                 onKeyDown={handleOptionKeyDown}
                              />
                              <button
                                 onClick={handleAddOption}
                                 disabled={!newOptionLabel.trim()}
                                 className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                              >
                                 Add
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

               </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
               <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
                  Cancel
               </button>
               <button
                  onClick={handleSubmit}
                  disabled={!name || !selectedType || (selectedType === 'relation' && !targetObjectId)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {initialData ? 'Save changes' : 'Create attribute'}
               </button>
            </div>

         </div>
      </div>
   );
};

export default CreateAttributeModal;
