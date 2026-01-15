
import React, { useState, useEffect } from 'react';
import {
   X,
   UploadCloud,
   CheckCircle,
   AlertCircle,
   ArrowRight,
} from 'lucide-react';

export type EntityType = 'companies' | 'people' | 'tasks';

interface ImportModalProps {
   isOpen: boolean;
   onClose: () => void;
   onComplete: () => void;
   entityType: EntityType;
}

type Step = 'upload' | 'match' | 'review' | 'importing';

// Configuration for different entity types
const IMPORT_CONFIG: Record<EntityType, {
   mockColumns: { id: string; name: string; sample: string }[];
   destinationFields: string[];
   title: string;
}> = {
   companies: {
      title: 'Import Companies',
      mockColumns: [
         { id: 'A', name: 'Company Name', sample: 'Acme Corp' },
         { id: 'B', name: 'Domain', sample: 'acme.com' },
         { id: 'C', name: 'Industry', sample: 'Software' },
         { id: 'D', name: 'Employees', sample: '50-100' },
         { id: 'E', name: 'City', sample: 'San Francisco' },
      ],
      destinationFields: ['Name', 'Domain', 'Industry', 'Size', 'Location', 'Owner', 'Status']
   },
   people: {
      title: 'Import People',
      mockColumns: [
         { id: 'A', name: 'Full Name', sample: 'Jane Doe' },
         { id: 'B', name: 'Email', sample: 'jane@acme.com' },
         { id: 'C', name: 'Job Title', sample: 'VP of Sales' },
         { id: 'D', name: 'Phone', sample: '+1 555 0123' },
         { id: 'E', name: 'LinkedIn', sample: 'linkedin.com/in/jane' },
      ],
      destinationFields: ['Name', 'Email', 'Role', 'Phone', 'LinkedIn', 'Company', 'Location']
   },
   tasks: {
      title: 'Import Tasks',
      mockColumns: [
         { id: 'A', name: 'Task Subject', sample: 'Follow up call' },
         { id: 'B', name: 'Due Date', sample: '2024-12-01' },
         { id: 'C', name: 'Priority', sample: 'High' },
         { id: 'D', name: 'Description', sample: 'Discuss contract renewal' },
         { id: 'E', name: 'Related To', sample: 'Acme Corp' },
      ],
      destinationFields: ['Title', 'Due Date', 'Priority', 'Description', 'Assignee', 'Related Record']
   }
};

interface MappingRowProps {
   column: { id: string, name: string, sample: string };
   dest?: string;
   status: 'confirmed' | 'missing';
}

const MappingRow: React.FC<MappingRowProps> = ({ column, dest, status }) => (
   <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 flex items-start justify-between group hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2 w-1/3 min-w-[200px]">
               <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 border border-gray-200">{column.id}</div>
               <div className="font-medium text-gray-900 text-sm">{column.name}</div>
            </div>

            <div className="text-gray-300">
               <ArrowRight size={16} />
            </div>

            <div className="flex items-center gap-2 flex-1">
               {dest ? (
                  <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 font-medium flex items-center justify-between w-full max-w-[240px]">
                     {dest}
                     <X size={14} className="text-gray-400 cursor-pointer hover:text-red-500" />
                  </div>
               ) : (
                  <div className="px-3 py-1.5 border border-dashed border-gray-300 rounded text-sm text-gray-400 w-full max-w-[240px]">
                     Select field...
                  </div>
               )}
            </div>
         </div>

         {/* Sample Data */}
         <div className="pl-[38px] text-xs text-gray-500">
            Sample: <span className="text-gray-700 font-mono bg-gray-50 px-1 rounded">{column.sample}</span>
         </div>
      </div>

      <div className="flex flex-col items-end gap-2 ml-4">
         {status === 'confirmed' ? (
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
               <CheckCircle size={12} /> Confirmed mapping
            </div>
         ) : (
            <div className="flex items-center gap-1.5 text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded-full">
               <AlertCircle size={12} /> Map this field
            </div>
         )}
         <button className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors">
            Edit
         </button>
      </div>
   </div>
);

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onComplete, entityType }) => {
   const [step, setStep] = useState<Step>('upload');
   const [dragActive, setDragActive] = useState(false);

   // Reset state when opening/changing type
   useEffect(() => {
      if (isOpen) {
         setStep('upload');
      }
   }, [isOpen, entityType]);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isOpen) {
            onClose();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, onClose]);

   const config = IMPORT_CONFIG[entityType];

   if (!isOpen) return null;

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
         setStep('match');
      }
   };

   const handleFileSelect = () => {
      // Simulate file selection
      setTimeout(() => setStep('match'), 500);
   };

   return (
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
         <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
               <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>

               {step !== 'upload' && (
                  <div className="flex items-center gap-2">
                     <div className={`flex items-center gap-2 text-sm ${step === 'match' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'match' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</div>
                        Upload
                     </div>
                     <div className="w-8 h-px bg-gray-200"></div>
                     <div className={`flex items-center gap-2 text-sm ${step === 'match' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'match' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</div>
                        Match
                     </div>
                     <div className="w-8 h-px bg-gray-200"></div>
                     <div className={`flex items-center gap-2 text-sm ${step === 'review' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'review' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>3</div>
                        Review
                     </div>
                  </div>
               )}

               <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                  <X size={20} />
               </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 relative">

               {step === 'upload' && (
                  <div className="flex flex-col items-center justify-center h-full p-8">
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
                  </div>
               )}

               {step === 'match' && (
                  <div className="p-8 max-w-4xl mx-auto">
                     <div className="mb-6 flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Map your columns</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200">utf-8</span>
                        </div>
                     </div>

                     {config.mockColumns.map((col, idx) => (
                        <MappingRow
                           key={col.id}
                           column={col}
                           dest={config.destinationFields[idx]}
                           status={idx < 4 ? 'confirmed' : 'missing'}
                        />
                     ))}
                  </div>
               )}

               {step === 'review' && (
                  <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
                     <div className="mb-4">
                        <h3 className="font-medium text-gray-900 mb-1">Review your import</h3>
                        <p className="text-sm text-gray-500">Check the data below before finalizing.</p>
                     </div>

                     <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex-1 flex flex-col">
                        <div className="overflow-auto flex-1">
                           <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                 <tr>
                                    <th className="px-4 py-3 w-10">#</th>
                                    {config.mockColumns.slice(0, 4).map(c => (
                                       <th key={c.id} className="px-4 py-3">{c.name}</th>
                                    ))}
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                 {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                       <td className="px-4 py-3 text-gray-400 text-xs">{i}</td>
                                       {config.mockColumns.slice(0, 4).map((c, idx) => (
                                          <td key={c.id} className="px-4 py-3">
                                             {idx === 0 ? `${c.sample} ${i}` : c.sample}
                                          </td>
                                       ))}
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* Footer */}
            {step !== 'upload' && (
               <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between flex-shrink-0 z-10">
                  <button
                     onClick={() => setStep(step === 'review' ? 'match' : 'upload')}
                     className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                     Go back
                  </button>
                  <div className="flex items-center gap-4">
                     <div className="text-xs text-gray-500">
                        <span className="font-medium text-gray-900">4</span> columns mapped
                     </div>
                     {step === 'match' ? (
                        <button
                           onClick={() => setStep('review')}
                           className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                        >
                           Review
                        </button>
                     ) : (
                        <button
                           onClick={onComplete}
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
