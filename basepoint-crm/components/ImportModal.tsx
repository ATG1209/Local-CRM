
import React, { useState, useEffect, useRef } from 'react';
import {
   X,
   UploadCloud,
   CheckCircle,
   AlertCircle,
   ArrowRight,
   ChevronDown,
   Loader2,
} from 'lucide-react';
import { parseCSV, ParsedCSV } from '../utils/csvHelper';

export type EntityType = 'companies' | 'people' | 'tasks';

interface ImportModalProps {
   isOpen: boolean;
   onClose: () => void;
   onComplete: (importedRecords: any[]) => void;
   entityType: EntityType;
   existingFields: string[];
}

type Step = 'upload' | 'match' | 'review' | 'importing';

// Destination fields for each entity type
const DESTINATION_FIELDS: Record<EntityType, { key: string; label: string; required?: boolean }[]> = {
   companies: [
      { key: 'name', label: 'Name', required: true },
      { key: 'domain', label: 'Domain' },
      { key: 'notes', label: 'Notes' },
      { key: 'externalId', label: 'External ID' },
      { key: 'quarters', label: 'Quarters' },
   ],
   people: [
      { key: 'name', label: 'Name', required: true },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'phone', label: 'Phone' },
      { key: 'location', label: 'Location' },
      { key: 'linkedIn', label: 'LinkedIn' },
      { key: 'description', label: 'Description' },
   ],
   tasks: [
      { key: 'title', label: 'Title', required: true },
      { key: 'description', label: 'Description' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'assignedTo', label: 'Assignee' },
   ]
};

interface MappingRowProps {
   sourceColumn: string;
   sampleValue: string;
   destinationField: string | null;
   destinationOptions: { key: string; label: string; required?: boolean }[];
   onMappingChange: (dest: string | null) => void;
   usedDestinations: Set<string>;
}

const MappingRow: React.FC<MappingRowProps> = ({
   sourceColumn,
   sampleValue,
   destinationField,
   destinationOptions,
   onMappingChange,
   usedDestinations
}) => {
   const [isOpen, setIsOpen] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setIsOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const selectedOption = destinationOptions.find(o => o.key === destinationField);

   return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 flex items-start justify-between group hover:shadow-sm transition-shadow">
         <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
               <div className="flex items-center gap-2 w-1/3 min-w-[200px]">
                  <div className="font-medium text-gray-900 text-sm truncate">{sourceColumn}</div>
               </div>

               <div className="text-gray-300">
                  <ArrowRight size={16} />
               </div>

               <div className="flex items-center gap-2 flex-1 relative" ref={dropdownRef}>
                  <div
                     onClick={() => setIsOpen(!isOpen)}
                     className={`px-3 py-1.5 border rounded text-sm w-full max-w-[240px] cursor-pointer flex items-center justify-between ${
                        destinationField
                           ? 'bg-gray-50 border-gray-200 text-gray-900 font-medium'
                           : 'border-dashed border-gray-300 text-gray-400'
                     }`}
                  >
                     <span>{selectedOption?.label || 'Select field...'}</span>
                     <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isOpen && (
                     <div className="absolute top-full left-0 mt-1 w-full max-w-[240px] bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
                        <div
                           onClick={() => { onMappingChange(null); setIsOpen(false); }}
                           className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
                        >
                           (Don't import)
                        </div>
                        {destinationOptions.map(opt => {
                           const isUsed = usedDestinations.has(opt.key) && opt.key !== destinationField;
                           return (
                              <div
                                 key={opt.key}
                                 onClick={() => {
                                    if (!isUsed) {
                                       onMappingChange(opt.key);
                                       setIsOpen(false);
                                    }
                                 }}
                                 className={`px-3 py-1.5 text-sm cursor-pointer flex items-center justify-between ${
                                    isUsed
                                       ? 'text-gray-300 cursor-not-allowed'
                                       : opt.key === destinationField
                                       ? 'bg-blue-50 text-blue-700'
                                       : 'text-gray-700 hover:bg-gray-50'
                                 }`}
                              >
                                 <span>{opt.label}</span>
                                 {opt.required && <span className="text-red-400 text-xs">*</span>}
                              </div>
                           );
                        })}
                     </div>
                  )}

                  {destinationField && (
                     <button
                        onClick={() => onMappingChange(null)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                     >
                        <X size={14} />
                     </button>
                  )}
               </div>
            </div>

            <div className="pl-0 text-xs text-gray-500">
               Sample: <span className="text-gray-700 font-mono bg-gray-50 px-1 rounded">{sampleValue || '(empty)'}</span>
            </div>
         </div>

         <div className="flex flex-col items-end gap-2 ml-4">
            {destinationField ? (
               <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle size={12} /> Mapped
               </div>
            ) : (
               <div className="flex items-center gap-1.5 text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded-full">
                  <AlertCircle size={12} /> Not mapped
               </div>
            )}
         </div>
      </div>
   );
};

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onComplete, entityType, existingFields }) => {
   const [step, setStep] = useState<Step>('upload');
   const [dragActive, setDragActive] = useState(false);
   const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
   const [columnMappings, setColumnMappings] = useState<Record<string, string | null>>({});
   const [isImporting, setIsImporting] = useState(false);
   const [importError, setImportError] = useState<string | null>(null);
   const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
   const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      if (isOpen) {
         setStep('upload');
         setParsedData(null);
         setColumnMappings({});
         setImportError(null);
         setIsImporting(false);
         setImportProgress({ current: 0, total: 0 });
      }
   }, [isOpen, entityType]);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isOpen && !isImporting) {
            onClose();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, onClose, isImporting]);

   const destinationFields = DESTINATION_FIELDS[entityType];

   // Auto-map columns based on name similarity
   const autoMapColumns = (headers: string[]) => {
      const mappings: Record<string, string | null> = {};
      const usedDestinations = new Set<string>();

      headers.forEach(header => {
         const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
         const match = destinationFields.find(f => {
            const normalizedField = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedKey = f.key.toLowerCase();
            return (
               !usedDestinations.has(f.key) &&
               (normalizedField === normalizedHeader ||
                normalizedKey === normalizedHeader ||
                normalizedHeader.includes(normalizedField) ||
                normalizedField.includes(normalizedHeader))
            );
         });
         if (match) {
            mappings[header] = match.key;
            usedDestinations.add(match.key);
         } else {
            mappings[header] = null;
         }
      });

      return mappings;
   };

   const processFile = async (file: File) => {
      try {
         const content = await file.text();
         const parsed = parseCSV(content);

         if (parsed.headers.length === 0) {
            setImportError('Could not parse CSV file. Please check the file format.');
            return;
         }

         setParsedData(parsed);
         setColumnMappings(autoMapColumns(parsed.headers));
         setImportError(null);
         setStep('match');
      } catch (err) {
         console.error('Error parsing file:', err);
         setImportError('Failed to read file. Please ensure it is a valid CSV.');
      }
   };

   const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
         setDragActive(true);
      } else if (e.type === "dragleave") {
         setDragActive(false);
      }
   };

   const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
         processFile(e.dataTransfer.files[0]);
      }
   };

   const handleFileSelect = () => {
      fileInputRef.current?.click();
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
         processFile(e.target.files[0]);
      }
   };

   const handleMappingChange = (sourceColumn: string, destField: string | null) => {
      setColumnMappings(prev => ({ ...prev, [sourceColumn]: destField }));
   };

   const usedDestinations = new Set(Object.values(columnMappings).filter(Boolean) as string[]);
   const mappedCount = Object.values(columnMappings).filter(Boolean).length;

   const requiredFieldsMapped = destinationFields
      .filter(f => f.required)
      .every(f => Object.values(columnMappings).includes(f.key));

   const handleImport = async () => {
      if (!parsedData || !requiredFieldsMapped) return;

      setIsImporting(true);
      setStep('importing');
      setImportError(null);

      const importedRecords: any[] = [];
      const totalRows = parsedData.rows.length;
      setImportProgress({ current: 0, total: totalRows });

      try {
         for (let i = 0; i < parsedData.rows.length; i++) {
            const row = parsedData.rows[i];
            const record: any = {
               id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
               createdAt: new Date().toISOString(),
            };

            // Set default values based on entity type
            if (entityType === 'companies') {
               record.logo = '';
               record.links = [];
               record.specialOffers = [];
               record.pointOfContactId = null;
               record.loggingStage = [];
               record.groundControl = [];
               record.sensitiveVertical = false;
               record.nal = false;
            } else if (entityType === 'people') {
               record.avatar = '';
               record.companyId = '';
               record.tags = [];
            } else if (entityType === 'tasks') {
               record.isCompleted = false;
               record.assignedTo = 'You';
               record.createdBy = 'You';
            }

            // Map CSV columns to record fields
            parsedData.headers.forEach((header, idx) => {
               const destField = columnMappings[header];
               if (destField && row[idx] !== undefined) {
                  let value: any = row[idx];

                  // Convert date strings for date fields
                  if (destField === 'dueDate' && value) {
                     const date = new Date(value);
                     value = isNaN(date.getTime()) ? null : date;
                  }

                  record[destField] = value;
               }
            });

            importedRecords.push(record);
            setImportProgress({ current: i + 1, total: totalRows });

            // Add small delay for visual feedback on larger imports
            if (totalRows > 10 && i % 10 === 0) {
               await new Promise(resolve => setTimeout(resolve, 10));
            }
         }

         onComplete(importedRecords);
      } catch (err) {
         console.error('Import error:', err);
         setImportError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
         setIsImporting(false);
         setStep('review');
      }
   };

   if (!isOpen) return null;

   const title = {
      companies: 'Import Companies',
      people: 'Import People',
      tasks: 'Import Tasks'
   }[entityType];

   return (
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
         <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
               <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

               {step !== 'upload' && step !== 'importing' && (
                  <div className="flex items-center gap-2">
                     <div className={`flex items-center gap-2 text-sm ${step === 'match' || step === 'review' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'match' ? 'border-blue-600 bg-blue-50 text-blue-600' : step === 'review' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300'}`}>
                           {step === 'review' ? <CheckCircle size={12} /> : '1'}
                        </div>
                        Upload
                     </div>
                     <div className="w-8 h-px bg-gray-200"></div>
                     <div className={`flex items-center gap-2 text-sm ${step === 'match' ? 'text-blue-600 font-medium' : step === 'review' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'match' ? 'border-blue-600 bg-blue-50 text-blue-600' : step === 'review' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300'}`}>
                           {step === 'review' ? <CheckCircle size={12} /> : '2'}
                        </div>
                        Match
                     </div>
                     <div className="w-8 h-px bg-gray-200"></div>
                     <div className={`flex items-center gap-2 text-sm ${step === 'review' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'review' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>3</div>
                        Review
                     </div>
                  </div>
               )}

               {!isImporting && (
                  <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                     <X size={20} />
                  </button>
               )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 relative">

               {step === 'upload' && (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                     <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.tsv,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                     />
                     <div
                        className={`w-full max-w-3xl border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer bg-white ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={handleFileSelect}
                     >
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                           <UploadCloud size={32} />
                        </div>
                        <button className="px-6 py-3 bg-[#1C1C1E] text-white font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm mb-4">
                           Upload data from file
                        </button>
                        <p className="text-sm text-gray-500 text-center max-w-md leading-relaxed">
                           You can upload any .csv, .tsv, .txt file for <strong>{entityType}</strong>.
                           The next step will allow you to match your columns.
                        </p>
                        <p className="mt-8 text-xs text-gray-400">.csv, .tsv, .txt spreadsheets accepted.</p>
                     </div>

                     {importError && (
                        <div className="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                           {importError}
                        </div>
                     )}
                  </div>
               )}

               {step === 'match' && parsedData && (
                  <div className="p-8 max-w-4xl mx-auto">
                     <div className="mb-6 flex items-center justify-between">
                        <div>
                           <h3 className="font-medium text-gray-900">Map your columns</h3>
                           <p className="text-sm text-gray-500 mt-1">
                              Found {parsedData.headers.length} columns and {parsedData.rows.length} rows
                           </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200">utf-8</span>
                        </div>
                     </div>

                     {!requiredFieldsMapped && (
                        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                           Please map all required fields (marked with *) to continue.
                        </div>
                     )}

                     {parsedData.headers.map((header, idx) => (
                        <MappingRow
                           key={header}
                           sourceColumn={header}
                           sampleValue={parsedData.rows[0]?.[idx] || ''}
                           destinationField={columnMappings[header] || null}
                           destinationOptions={destinationFields}
                           onMappingChange={(dest) => handleMappingChange(header, dest)}
                           usedDestinations={usedDestinations}
                        />
                     ))}
                  </div>
               )}

               {step === 'review' && parsedData && (
                  <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
                     <div className="mb-4">
                        <h3 className="font-medium text-gray-900 mb-1">Review your import</h3>
                        <p className="text-sm text-gray-500">
                           {parsedData.rows.length} records will be imported with {mappedCount} mapped fields.
                        </p>
                     </div>

                     {importError && (
                        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                           {importError}
                        </div>
                     )}

                     <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex-1 flex flex-col">
                        <div className="overflow-auto flex-1">
                           <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0">
                                 <tr>
                                    <th className="px-4 py-3 w-10">#</th>
                                    {parsedData.headers.map(h => {
                                       const mapped = columnMappings[h];
                                       const destField = destinationFields.find(f => f.key === mapped);
                                       return (
                                          <th key={h} className="px-4 py-3">
                                             <div className="flex flex-col">
                                                <span className="text-gray-900">{h}</span>
                                                {destField && (
                                                   <span className="text-xs font-normal text-blue-600">→ {destField.label}</span>
                                                )}
                                             </div>
                                          </th>
                                       );
                                    })}
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                 {parsedData.rows.slice(0, 50).map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                       <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                                       {row.map((cell, idx) => (
                                          <td key={idx} className="px-4 py-3 truncate max-w-[200px]" title={cell}>
                                             {cell || <span className="text-gray-300">-</span>}
                                          </td>
                                       ))}
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                        {parsedData.rows.length > 50 && (
                           <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                              Showing first 50 of {parsedData.rows.length} rows
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {step === 'importing' && (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                     <Loader2 size={48} className="text-blue-600 animate-spin mb-6" />
                     <h3 className="text-lg font-medium text-gray-900 mb-2">Importing records...</h3>
                     <p className="text-sm text-gray-500 mb-4">
                        {importProgress.current} of {importProgress.total} records processed
                     </p>
                     <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                           className="h-full bg-blue-600 transition-all duration-300"
                           style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                        />
                     </div>
                  </div>
               )}
            </div>

            {/* Footer */}
            {step !== 'upload' && step !== 'importing' && (
               <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between flex-shrink-0 z-10">
                  <button
                     onClick={() => setStep(step === 'review' ? 'match' : 'upload')}
                     className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                     Go back
                  </button>
                  <div className="flex items-center gap-4">
                     <div className="text-xs text-gray-500">
                        <span className="font-medium text-gray-900">{mappedCount}</span> columns mapped
                     </div>
                     {step === 'match' ? (
                        <button
                           onClick={() => setStep('review')}
                           disabled={!requiredFieldsMapped}
                           className={`px-6 py-2 text-sm font-medium rounded-md shadow-sm transition-colors ${
                              requiredFieldsMapped
                                 ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                 : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                           }`}
                        >
                           Review
                        </button>
                     ) : (
                        <button
                           onClick={handleImport}
                           className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                        >
                           Run Import
                        </button>
                     )}
                  </div>
               </div>
            )}

         </div>
      </div>
   );
};

export default ImportModal;
