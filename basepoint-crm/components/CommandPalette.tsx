
import React, { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, Users, CheckSquare, ArrowRight, Command } from 'lucide-react';
import { ViewState, Company, Activity, Person } from '../types';
import CompanyAvatar from './CompanyAvatar';

interface CommandPaletteProps {
   isOpen: boolean;
   onClose: () => void;
   onNavigate: (view: ViewState, recordId?: string) => void;
   companies: Company[];
   activities: Activity[];
   people: Person[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
   isOpen,
   onClose,
   onNavigate,
   companies,
   activities,
   people
}) => {
   const [query, setQuery] = useState('');
   const [selectedIndex, setSelectedIndex] = useState(0);
   const inputRef = useRef<HTMLInputElement>(null);

   // Grouped results using props
   const filteredCompanies = (companies || []).filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
   const filteredPeople = (people || []).filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
   const filteredActivities = (activities || []).filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

   const hasResults = filteredCompanies.length > 0 || filteredPeople.length > 0 || filteredActivities.length > 0;

   type ResultItem =
      | { kind: 'company'; entity: Company }
      | { kind: 'person'; entity: Person }
      | { kind: 'activity'; entity: Activity };

   const resultItems: ResultItem[] = React.useMemo(() => {
      if (!query) return [];
      const items: ResultItem[] = [];
      filteredCompanies.slice(0, 3).forEach(company => items.push({ kind: 'company', entity: company }));
      filteredPeople.slice(0, 3).forEach(person => items.push({ kind: 'person', entity: person }));
      filteredActivities.slice(0, 3).forEach(activity => items.push({ kind: 'activity', entity: activity }));
      return items;
   }, [filteredCompanies, filteredPeople, filteredActivities, query]);

   useEffect(() => {
      if (isOpen) {
         setTimeout(() => inputRef.current?.focus(), 50);
         setQuery('');
         setSelectedIndex(0);
      }
   }, [isOpen]);

   useEffect(() => {
      setSelectedIndex(prev => {
         if (resultItems.length === 0) return 0;
         return Math.min(prev, resultItems.length - 1);
      });
   }, [resultItems.length]);

   const handleSelect = (item: ResultItem | undefined) => {
      if (!item) return;
      if (item.kind === 'company') {
         onNavigate('companies', item.entity.id);
      } else if (item.kind === 'person') {
         onNavigate('people', item.entity.id);
      } else {
         onNavigate('tasks', item.entity.id);
      }
      onClose();
   };

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
         onClose();
         return;
      }
      if (e.key === 'ArrowDown') {
         e.preventDefault();
         if (resultItems.length === 0) return;
         setSelectedIndex(prev => Math.min(prev + 1, resultItems.length - 1));
      } else if (e.key === 'ArrowUp') {
         e.preventDefault();
         if (resultItems.length === 0) return;
         setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
         e.preventDefault();
         if (resultItems.length === 0) return;
         handleSelect(resultItems[selectedIndex]);
      }
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
                     <p>Search for companies, people, or activities.</p>
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
                        <div
                           key={company.id}
                           onClick={() => handleSelect({ kind: 'company', entity: company })}
                           className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group ${resultItems[selectedIndex] && resultItems[selectedIndex].kind === 'company' && resultItems[selectedIndex].entity.id === company.id ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                        >
                           <div className="flex items-center gap-3">
                              <CompanyAvatar name={company.name} size="sm" />
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
                        <div
                           key={person.id}
                           onClick={() => handleSelect({ kind: 'person', entity: person })}
                           className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group ${resultItems[selectedIndex] && resultItems[selectedIndex].kind === 'person' && resultItems[selectedIndex].entity.id === person.id ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[9px] text-gray-500 border border-gray-200 select-none">
                                 {person.name ? person.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??'}
                              </div>
                              <span className="text-sm font-medium text-gray-800">{person.name}</span>
                              <span className="text-xs text-gray-400 ml-1">{person.role}</span>
                           </div>
                           <span className="text-xs text-gray-400 group-hover:text-gray-600">Open</span>
                        </div>
                     ))}
                  </div>
               )}

               {query && filteredActivities.length > 0 && (
                  <div className="mb-2">
                     <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-1.5">Activities</div>
                     {filteredActivities.slice(0, 3).map(activity => (
                        <div
                           key={activity.id}
                           onClick={() => handleSelect({ kind: 'activity', entity: activity })}
                           className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group ${resultItems[selectedIndex] && resultItems[selectedIndex].kind === 'activity' && resultItems[selectedIndex].entity.id === activity.id ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                        >
                           <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border border-gray-300 ${activity.isCompleted ? 'bg-green-500 border-green-500' : 'bg-white'}`}></div>
                              <span className="text-sm font-medium text-gray-800 line-clamp-1">{activity.title}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              {activity.dueDate && <span className="text-[10px] text-gray-400">{new Date(activity.dueDate).toLocaleDateString()}</span>}
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
