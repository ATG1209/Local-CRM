import React, { useState, useEffect } from 'react';
import { X, LayoutList, Columns3, Type, ChevronDown, Check, Plus, AlertCircle } from 'lucide-react';
import { ColumnDefinition, SavedView, KanbanConfig, Attribute } from '../types';
import { generateViewId } from '../utils/viewsStorage';
import { pluralize } from '../utils/attributeHelpers';
import TypeIcon from './TypeIcon';

interface CreateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string;
  objectName: string;
  attributes: Attribute[];
  columns: ColumnDefinition[];
  onCreateView: (view: SavedView) => void;
  onCreateAttribute?: () => void;
}

type Step = 'type' | 'configure';

const CreateViewModal: React.FC<CreateViewModalProps> = ({
  isOpen,
  onClose,
  objectId,
  objectName,
  attributes,
  columns,
  onCreateView,
  onCreateAttribute
}) => {
  const [step, setStep] = useState<Step>('type');
  const [viewType, setViewType] = useState<'table' | 'kanban'>('table');
  const [viewName, setViewName] = useState('');
  const [groupByAttributeId, setGroupByAttributeId] = useState<string>('');
  const [selectedCardFields, setSelectedCardFields] = useState<string[]>([]);
  const [isGroupByOpen, setIsGroupByOpen] = useState(false);
  const [isCardFieldsOpen, setIsCardFieldsOpen] = useState(false);

  // Get attributes that can be used for Kanban grouping (select, status, multi-select)
  const groupableAttributes = columns.filter(col =>
    col.type === 'select' || col.type === 'status' || col.type === 'multi-select'
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('type');
      setViewType('table');
      setViewName('');
      setGroupByAttributeId(groupableAttributes[0]?.id || '');
      setSelectedCardFields([]);
    }
  }, [isOpen]);

  // Auto-select first groupable attribute when switching to kanban
  useEffect(() => {
    if (viewType === 'kanban' && !groupByAttributeId && groupableAttributes.length > 0) {
      setGroupByAttributeId(groupableAttributes[0].id);
    }
  }, [viewType, groupableAttributes]);

  if (!isOpen) return null;

  const handleTypeSelect = (type: 'table' | 'kanban') => {
    setViewType(type);
    setStep('configure');
  };

  const handleBack = () => {
    setStep('type');
  };

  const handleCreate = () => {
    const newView: SavedView = {
      id: generateViewId(),
      name: viewName || (viewType === 'kanban' ? 'Pipeline' : `All ${pluralize(objectName)}`),
      objectId,
      type: viewType,
      columns: columns,
      sort: [{ key: columns[0]?.id || 'name', direction: 'asc' }],
      filters: []
    };

    if (viewType === 'kanban' && groupByAttributeId) {
      newView.kanbanConfig = {
        groupByAttributeId,
        cardFields: selectedCardFields.length > 0 ? selectedCardFields : undefined,
        showColumnCounts: true
      };
    }

    onCreateView(newView);
    onClose();
  };

  const toggleCardField = (fieldId: string) => {
    setSelectedCardFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const selectedGroupAttribute = columns.find(col => col.id === groupByAttributeId);

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-100 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">
              {viewType === 'kanban' ? <Columns3 size={18} /> : <LayoutList size={18} />}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Create view</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Step 1: View Type Selection */}
        {step === 'type' && (
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">View type</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Table Option */}
              <button
                onClick={() => handleTypeSelect('table')}
                className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
              >
                <div className="p-3 bg-green-100 rounded-lg text-green-600 group-hover:bg-green-200 transition-colors">
                  <LayoutList size={28} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Table</p>
                  <p className="text-xs text-gray-500 mt-1">Organize your records on a table</p>
                </div>
              </button>

              {/* Kanban Option */}
              <button
                onClick={() => handleTypeSelect('kanban')}
                className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
              >
                <div className="p-3 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors">
                  <Columns3 size={28} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Kanban</p>
                  <p className="text-xs text-gray-500 mt-1">Organize your records on a pipeline</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Configure View */}
        {step === 'configure' && (
          <>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* View Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <div className="relative">
                  <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter a title for this view"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                  />
                </div>
              </div>

              {/* Kanban-specific: Group By Attribute */}
              {viewType === 'kanban' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kanban Columns</label>
                    {groupableAttributes.length === 0 ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-amber-800 font-medium">No status attributes found</p>
                            <p className="text-xs text-amber-700 mt-1">
                              Kanban views require a select or status attribute to group cards into columns.
                            </p>
                            {onCreateAttribute && (
                              <button
                                onClick={onCreateAttribute}
                                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900"
                              >
                                <Plus size={14} />
                                New Status Attribute
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setIsGroupByOpen(!isGroupByOpen)}
                          className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 transition-colors"
                        >
                          {selectedGroupAttribute ? (
                            <span className="flex items-center gap-2">
                              <TypeIcon type={selectedGroupAttribute.type} />
                              {selectedGroupAttribute.label}
                            </span>
                          ) : (
                            <span className="text-gray-400">Select a status attribute</span>
                          )}
                          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isGroupByOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isGroupByOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 max-h-48 overflow-y-auto">
                            <div className="px-3 py-1.5 border-b border-gray-100">
                              <input
                                type="text"
                                placeholder="Search attributes..."
                                className="w-full text-sm outline-none placeholder-gray-400"
                              />
                            </div>
                            {groupableAttributes.map(attr => (
                              <button
                                key={attr.id}
                                onClick={() => {
                                  setGroupByAttributeId(attr.id);
                                  setIsGroupByOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${attr.id === groupByAttributeId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                  }`}
                              >
                                <TypeIcon type={attr.type} />
                                {attr.label}
                                {attr.id === groupByAttributeId && <Check size={14} className="ml-auto" />}
                              </button>
                            ))}
                            {onCreateAttribute && (
                              <button
                                onClick={() => {
                                  setIsGroupByOpen(false);
                                  onCreateAttribute();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-100"
                              >
                                <Plus size={14} />
                                New Status Attribute
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Fields Selection - Inline checkboxes instead of dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Card Fields <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Choose which fields to display on each card</p>
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {columns.filter(col => col.id !== groupByAttributeId).map(col => (
                        <button
                          key={col.id}
                          onClick={() => toggleCardField(col.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${selectedCardFields.includes(col.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selectedCardFields.includes(col.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                            }`}>
                            {selectedCardFields.includes(col.id) && <Check size={12} className="text-white" />}
                          </div>
                          <TypeIcon type={col.type} />
                          <span className="truncate">{col.label}</span>
                        </button>
                      ))}
                      {columns.filter(col => col.id !== groupByAttributeId).length === 0 && (
                        <div className="px-3 py-4 text-sm text-gray-400 text-center">No fields available</div>
                      )}
                    </div>
                    {selectedCardFields.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">{selectedCardFields.length} field{selectedCardFields.length !== 1 ? 's' : ''} selected</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center">
              <button
                onClick={handleBack}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                Back
              </button>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
                  Cancel <span className="text-gray-400 text-xs ml-1">ESC</span>
                </button>
                <button
                  onClick={handleCreate}
                  disabled={viewType === 'kanban' && groupableAttributes.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Confirm <span className="text-blue-200 text-xs">↵</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer for type selection step */}
        {step === 'type' && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
              Cancel <span className="text-gray-400 text-xs ml-1">ESC</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CreateViewModal;
