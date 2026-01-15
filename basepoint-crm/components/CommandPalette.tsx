
import React, { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, Users, CheckSquare, ArrowRight, Command } from 'lucide-react';
import { ViewState, Company, Task, Person } from '../types';

interface CommandPaletteProps {
   isOpen: boolean;
   onClose: () => void;
   onNavigate: (view: ViewState) => void;
   companies: Company[];
   tasks: Task[];
   people: Person[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
   isOpen,
   onClose,
   onNavigate,
   companies,
   tasks,
   people
}) => {
   const [query, setQuery] = useState('');
   const [selectedIndex, setSelectedIndex] = useState(0);
   const inputRef = useRef<HTMLInputElement>(null);

   // Grouped results using props
   const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
   const filteredPeople = people.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
   const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));

   const hasResults = filteredCompanies.length > 0 || filteredPeople.length > 0 || filteredTasks.length > 0;

   useEffect(() => {
      if (isOpen) {
         setTimeout(() => inputRef.current?.focus(), 50);
         setQuery('');
         setSelectedIndex(0);
      }
   }, [isOpen]);

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Simplified navigation logic for the demo
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
         <div
            className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
            onKeyDown={handleKeyDown}
         >
            <div className="flex items-center px-4 py-3 border-b border-gray-100 gap-3">
               <Search size={18} className="text-gray-400" />
               <input
                  ref={inputRef}
                  className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-400"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
               />
               <div className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">ESC</div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
               {!query && (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">
                     <Command size={24} className="mx-auto mb-2 opacity-50" />
                     <p>Search for companies, people, or tasks.</p>
                  </div>
               )}

               {query && !hasResults && (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                     No results found for "{query}"
                  </div>
               )}

               {query && filteredCompanies.length > 0 && (
                  <div className="mb-2">
                     <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-1.5">Companies</div>
                     {filteredCompanies.slice(0, 3).map(company => (
                        <div key={company.id} onClick={() => { onNavigate('companies'); onClose(); }} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer group">
                           <div className="flex items-center gap-3">
                              <img src={company.logo} className="w-5 h-5 rounded-sm" alt="" />
                              <span className="text-sm font-medium text-gray-800">{company.name}</span>
                           </div>
                           <span className="text-xs text-gray-400 group-hover:text-gray-600">Open</span>
                        </div>
                     ))}
                  </div>
               )}

               {query && filteredPeople.length > 0 && (
                  <div className="mb-2">
                     <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-1.5">People</div>
                     {filteredPeople.slice(0, 3).map(person => (
                        <div key={person.id} onClick={() => { onNavigate('people'); onClose(); }} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer group">
                           <div className="flex items-center gap-3">
                              <img src={person.avatar} className="w-5 h-5 rounded-full" alt="" />
                              <span className="text-sm font-medium text-gray-800">{person.name}</span>
                              <span className="text-xs text-gray-400 ml-1">{person.role}</span>
                           </div>
                           <span className="text-xs text-gray-400 group-hover:text-gray-600">View</span>
                        </div>
                     ))}
                  </div>
               )}

               {query && filteredTasks.length > 0 && (
                  <div className="mb-2">
                     <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-1.5">Tasks</div>
                     {filteredTasks.slice(0, 3).map(task => (
                        <div key={task.id} onClick={() => { onNavigate('tasks'); onClose(); }} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer group">
                           <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border border-gray-300 ${task.isCompleted ? 'bg-green-500 border-green-500' : 'bg-white'}`}></div>
                              <span className="text-sm font-medium text-gray-800 line-clamp-1">{task.title}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              {task.dueDate && <span className="text-[10px] text-gray-400">{new Date(task.dueDate).toLocaleDateString()}</span>}
                              <ArrowRight size={12} className="text-gray-400" />
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 text-[10px] text-gray-500 flex justify-between">
               <div className="flex gap-3">
                  <span><strong>↑↓</strong> to navigate</span>
                  <span><strong>↵</strong> to select</span>
               </div>
            </div>
         </div>
      </div>
   );
};

export default CommandPalette;
