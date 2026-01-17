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
   Trash2,
   Zap
} from 'lucide-react';
import { ColumnType, AttributeOption } from '../types';
import { fetchObjects, ObjectType, Attribute } from '../utils/schemaApi';
import { isProtectedColumn } from '../utils/attributeHelpers';

interface CreateAttributeModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSave: (data: any) => void; // partial Attribute data
   initialData?: any | null; // Attribute or ColumnDefinition
   onDelete?: (id: string) => void; // Delete attribute callback
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
   { type: 'link', label: 'Link', icon: <Zap size={16} /> },
];

const COLOR_OPTIONS = [
   { name: 'Default', value: 'bg-gray-100 text-gray-700', border: 'border-gray-200' },
   { name: 'Gray', value: 'bg-gray-200 text-gray-700', border: 'border-gray-300' },
   { name: 'Brown', value: 'bg-orange-200 text-orange-800', border: 'border-orange-300' },
   { name: 'Orange', value: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
   { name: 'Yellow', value: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
   { name: 'Green', value: 'bg-green-100 text-green-700', border: 'border-green-200' },
   { name: 'Blue', value: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
   { name: 'Purple', value: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
   { name: 'Pink', value: 'bg-pink-100 text-pink-700', border: 'border-pink-200' },
   { name: 'Red', value: 'bg-red-100 text-red-700', border: 'border-red-200' },
];

const CreateAttributeModal: React.FC<CreateAttributeModalProps> = ({ isOpen, onClose, onSave, initialData, onDelete }) => {
   const [name, setName] = useState('');
   const [selectedType, setSelectedType] = useState<ColumnType | null>(null);
   const [description, setDescription] = useState('');
   const [options, setOptions] = useState<AttributeOption[]>([]);
   const [newOptionLabel, setNewOptionLabel] = useState('');
   const [newOptionColor, setNewOptionColor] = useState(COLOR_OPTIONS[0].value);
   const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

   // Relation specific state
   const [availableObjects, setAvailableObjects] = useState<ObjectType[]>([]);
   const [targetObjectId, setTargetObjectId] = useState<string>('');
   const [abbreviation, setAbbreviation] = useState<string>('');

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
         setAbbreviation(initialData.config?.abbreviation || '');
      } else {
         setName('');
         setSelectedType(null);
         setDescription('');
         setOptions([]);
         setTargetObjectId('');
         setAbbreviation('');
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
               cardinality: selectedType === 'relation' ? 'many' : undefined, // Default to many-to-many
               abbreviation: selectedType === 'link' ? abbreviation : undefined
            }
         };
         onSave(attributeData);
         onClose();
      }
   };

   const handleDelete = () => {
      if (!initialData?.id) return;

      // Check if column is protected
      const accessorKey = initialData.accessorKey || initialData.id;
      if (isProtectedColumn(accessorKey) || isProtectedColumn(initialData.id)) return;

      onDelete?.(initialData.id);
      onClose();
   };

   const handleAddOption = () => {
      if (!newOptionLabel.trim()) return;
      setOptions([...options, {
         id: Math.random().toString(36).substr(2, 9),
         label: newOptionLabel.trim(),
         color: newOptionColor
      }]);
      setNewOptionLabel('');
      // Reset color to default or keep selected? Usually keeping selected is nice for batch adding, 
      // but creating a new distinct one might imply reset. I'll keep it for now.
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

                  {/* Link Abbreviation (Only for Link type) */}
                  {selectedType === 'link' && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Abbreviation</label>
                        <input
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-gray-900 placeholder:text-gray-400 shadow-sm uppercase"
                           placeholder="e.g. GA, CS, GONG"
                           value={abbreviation}
                           onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                           maxLength={10}
                        />
                        <p className="mt-1.5 text-xs text-gray-500">Short code displayed in the Quick Links section (e.g., "GA" for Google Ads).</p>
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
                              <div className="relative">
                                 <button
                                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                                    className={`h-full aspect-square rounded-md border border-gray-300 flex items-center justify-center transition-colors ${newOptionColor}`}
                                 >
                                    <div className="w-4 h-4 rounded-full bg-current opacity-50" />
                                 </button>

                                 {isColorPickerOpen && (
                                    <>
                                       <div
                                          className="fixed inset-0 z-10"
                                          onClick={() => setIsColorPickerOpen(false)}
                                       />
                                       <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-xl border border-gray-200 z-20 w-48 max-h-60 overflow-y-auto">
                                          <div className="space-y-1">
                                             {COLOR_OPTIONS.map((color) => (
                                                <button
                                                   key={color.name}
                                                   onClick={() => {
                                                      setNewOptionColor(color.value);
                                                      setIsColorPickerOpen(false);
                                                   }}
                                                   className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-gray-100 transition-colors ${newOptionColor === color.value ? 'bg-gray-50' : ''}`}
                                                >
                                                   <span className={`w-4 h-4 rounded-full border ${color.value} ${color.border || 'border-transparent'}`} />
                                                   <span className="text-gray-700">{color.name}</span>
                                                   {newOptionColor === color.value && <Check size={14} className="ml-auto text-blue-600" />}
                                                </button>
                                             ))}
                                          </div>
                                       </div>
                                    </>
                                 )}
                              </div>

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

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center gap-3">
               {initialData && onDelete && !isProtectedColumn(initialData.accessorKey || initialData.id) && !isProtectedColumn(initialData.id) ? (
                  <button
                     onClick={handleDelete}
                     className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200"
                  >
                     Delete
                  </button>
               ) : (
                  <div />
               )}
               <div className="flex gap-3">
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
      </div>
   );
};

export default CreateAttributeModal;
