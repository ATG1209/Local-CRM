import React from 'react';
import { WORKFLOW_RUNS } from '../constants';
import { 
  ArrowRight, 
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Circle,
  Play,
  Share2,
  MoreVertical,
  Zap,
  Search,
  Split
} from 'lucide-react';

const WorkflowsView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
       {/* Header */}
       <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
         <div className="flex items-center gap-2 text-gray-500 text-sm">
           <span>Workflows</span>
           <span className="text-gray-300">/</span>
           <span className="font-semibold text-gray-900">Automatically qualify leads</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
               <img className="w-7 h-7 rounded-full border-2 border-white" src="https://picsum.photos/30/30?random=1" alt=""/>
               <div className="w-7 h-7 rounded-full border-2 border-white bg-yellow-400 flex items-center justify-center text-[10px] font-bold text-yellow-900">A</div>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors">
               <Share2 size={14} /> Share
            </button>
            <MoreVertical size={16} className="text-gray-400" />
         </div>
      </div>

      {/* Toolbar */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-6 bg-white flex-shrink-0 z-20 relative">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium cursor-pointer hover:text-gray-900">
               <Settings size={14} /> Editor
            </div>
            <div className="flex items-center gap-2 text-gray-900 text-sm font-medium bg-gray-100 px-3 py-1 rounded-md">
               <div className="w-2 h-2 border border-gray-400 rounded-full"></div> Runs <span className="text-gray-500 ml-1">70</span>
            </div>
         </div>
         
         <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
               <div className="w-2 h-2 bg-green-500 rounded-full"></div> Live
             </div>
             <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
             </div>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
         {/* Canvas Area */}
         <div className="flex-1 bg-white relative overflow-hidden flex justify-center pt-16">
            {/* Dot Grid Background */}
            <div className="absolute inset-0 z-0" style={{
                backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }}></div>

            <div className="relative z-10 w-[500px] flex flex-col items-center gap-16">
               <div className="absolute left-[-60px] top-0 bg-purple-50 text-purple-600 px-2 py-1 rounded text-xs font-medium border border-purple-100">Run #70</div>

               {/* Step 1: Trigger */}
               <div className="w-full relative">
                  <div className="absolute -top-6 left-0 text-xs text-gray-500 font-medium flex items-center gap-1">
                     <Zap size={12} /> Trigger
                  </div>
                  <div className="absolute -top-6 right-0 text-xs text-purple-600 font-medium flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                     <RotateCcw size={10} className="animate-spin" /> Running
                  </div>

                  <div className="bg-white rounded-xl border-2 border-green-400 shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-4 relative z-10">
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                              <Zap size={16} />
                           </div>
                           <span className="font-semibold text-gray-900">Record command</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Records</span>
                     </div>
                     <p className="text-sm text-gray-500">Trigger on a Company</p>
                  </div>
                  
                  {/* Connector Line */}
                  <div className="absolute left-1/2 top-full h-16 w-px bg-blue-200 -translate-x-1/2 z-0">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-400 rounded-full z-10"></div>
                     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-gray-300">
                        <ArrowRight size={14} className="rotate-90" />
                     </div>
                  </div>
               </div>

               {/* Step 2: Action */}
               <div className="w-full relative">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative z-10 hover:shadow-md transition-shadow cursor-pointer group">
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-pink-100 text-pink-600 rounded-md">
                              <Search size={16} />
                           </div>
                           <span className="font-semibold text-gray-900">Research record</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <div className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200">✨</div> Agent
                        </span>
                     </div>
                     <p className="text-sm text-gray-500">Determine funding stage of company</p>
                  </div>
                   {/* Connector Line */}
                  <div className="absolute left-1/2 top-full h-16 w-px bg-blue-200 -translate-x-1/2 z-0">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-400 rounded-full z-10"></div>
                     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-gray-300">
                        <ArrowRight size={14} className="rotate-90" />
                     </div>
                  </div>
               </div>

               {/* Step 3: Switch */}
               <div className="w-full relative">
                   <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative z-10 hover:shadow-md transition-shadow cursor-pointer">
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md">
                              <Split size={16} />
                           </div>
                           <span className="font-semibold text-gray-900">Switch</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Conditions</span>
                     </div>
                     <p className="text-sm text-gray-400 italic">No description</p>
                  </div>

                  {/* Branch lines */}
                  <div className="absolute left-1/2 top-full h-8 w-px bg-blue-200 -translate-x-1/2 z-0">
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-400 rounded-full z-10"></div>
                  </div>
                  
                  {/* Horizontal Branching */}
                  <div className="absolute top-[calc(100%+32px)] left-0 w-full flex justify-between px-10 border-t border-dashed border-gray-200 pt-2">
                      <div className="text-xs text-gray-400 text-center w-24">Condition 1</div>
                      <div className="text-xs text-gray-400 text-center w-24">Condition 2</div>
                      <div className="text-xs text-gray-400 text-center w-24">Condition 3</div>
                  </div>
               </div>

            </div>
         </div>

         {/* Sidebar History */}
         <div className="w-80 bg-white border-l border-gray-200 flex flex-col z-20 shadow-xl">
             <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 cursor-pointer bg-gray-50">
                   <div className="flex items-center gap-3">
                      <RotateCcw size={16} className="text-gray-400 animate-spin" />
                      <span className="font-medium text-sm text-gray-900">Run #70</span>
                   </div>
                   <span className="text-xs text-gray-500">Executing</span>
                </div>
                {WORKFLOW_RUNS.filter(r => r.id !== 70).map(run => (
                   <div key={run.id} className="px-4 py-3 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 cursor-pointer group">
                      <div className="flex items-center gap-3">
                         {run.status === 'Completed' ? 
                           <CheckCircle size={16} className="text-green-500" /> : 
                           <XCircle size={16} className="text-red-500" />
                         }
                         <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-900">Run #{run.id}</span>
                         </div>
                         <div className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600 flex items-center gap-1 group-hover:bg-white border border-transparent group-hover:border-gray-200">
                           <div className="w-3 h-3 bg-gray-300 rounded-full flex items-center justify-center text-white text-[8px]">$</div> {run.credits}
                         </div>
                      </div>
                      <span className="text-xs text-gray-400">{run.time}</span>
                   </div>
                ))}
             </div>

             {/* Stats Footer */}
             <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                <div className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Overview</div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="bg-white p-3 rounded-lg border border-gray-200 relative overflow-hidden">
                      <div className="text-2xl font-semibold text-green-600">69</div>
                      <div className="text-xs text-gray-500">Completed</div>
                      <CheckCircle size={14} className="absolute top-3 right-3 text-green-500 opacity-50" />
                      <div className="absolute bottom-0 left-0 h-1 w-full bg-green-100"></div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-gray-200 relative overflow-hidden">
                      <div className="text-2xl font-semibold text-red-600">0</div>
                      <div className="text-xs text-gray-500">Failed</div>
                      <XCircle size={14} className="absolute top-3 right-3 text-red-500 opacity-50" />
                      <div className="absolute bottom-0 left-0 h-1 w-full bg-red-100"></div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-gray-200 relative overflow-hidden">
                      <div className="text-xl font-semibold text-gray-700">1</div>
                      <div className="text-xs text-gray-500">In progress</div>
                      <RotateCcw size={14} className="absolute top-3 right-3 text-gray-400 opacity-50" />
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-gray-200 relative overflow-hidden">
                      <div className="text-xl font-semibold text-gray-700">18 <span className="text-xs font-normal text-gray-400">seconds</span></div>
                      <div className="text-xs text-gray-500">Avg. runtime</div>
                      <Clock size={14} className="absolute top-3 right-3 text-gray-400 opacity-50" />
                      <div className="inline-flex items-center ml-1 text-[10px] text-green-600 bg-green-50 px-1 rounded">↓</div>
                   </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                   <div>
                     <div className="text-lg font-semibold text-gray-400">896 <span className="text-xs font-normal">credits consumed</span></div>
                     <div className="text-xs text-gray-300">1,000 included</div>
                   </div>
                   <Settings size={14} className="text-gray-300 cursor-pointer hover:text-gray-500" />
                </div>
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-green-200 w-[89%]"></div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default WorkflowsView;