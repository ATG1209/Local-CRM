import React, { useState, useRef } from 'react';
import { Task, Company, Person, ColumnDefinition, SavedView } from '../types';
import GenericObjectView from './GenericObjectView';
import TaskDetailPanel from './TaskDetailPanel';
import DatePickerPopover from './DatePickerPopover';
import SearchableSelect from './SearchableSelect';
import CompanyAvatar from './CompanyAvatar';
import {
   CheckCircle,
   Circle,
   Star
} from 'lucide-react';

interface TasksViewProps {
   tasks: Task[];
   companies: Company[];
   people: Person[];
   onAddTask: (task: Task) => void;
   onUpdateTask: (task: Task) => void;
   onDeleteTask: (id: string) => void;
   onOpenQuickTask: () => void;
   newTaskTrigger?: number;
}

const AVAILABLE_COLUMNS: ColumnDefinition[] = [
   { id: 'isCompleted', label: 'Done', type: 'checkbox', accessorKey: 'isCompleted', visible: true, width: 40 },
   { id: 'title', label: 'Task', type: 'text', accessorKey: 'title', visible: true, isSystem: true, width: 300 },
   { id: 'due', label: 'Due Date', type: 'date', accessorKey: 'dueDate', visible: true, width: 160 },
   { id: 'record', label: 'Linked Record', type: 'relation', accessorKey: 'linkedCompanyId', visible: true, width: 200 },
   { id: 'assignee', label: 'Assignee', type: 'person', accessorKey: 'assignedTo', visible: true, width: 180 },
];

const TasksView: React.FC<TasksViewProps> = ({
   tasks = [],
   companies = [],
   people = [],
   onAddTask,
   onUpdateTask,
   onDeleteTask,
   onOpenQuickTask,
   newTaskTrigger
}) => {

   // State for date picker management
   const [openDatePickerId, setOpenDatePickerId] = useState<string | null>(null);
   const datePickerRef = useRef<HTMLDivElement>(null);

   React.useEffect(() => {
      if (newTaskTrigger) {
         onOpenQuickTask();
      }
   }, [newTaskTrigger, onOpenQuickTask]);

   const companyOptions = companies.map(c => ({
      id: c.id,
      label: c.name,
      icon: <CompanyAvatar name={c.name} size="xs" />
   }));

   const userOptions = people.map(u => ({
      id: u.id,
      label: u.name,
      icon: <img src={u.avatar} className="w-4 h-4 rounded-full" alt="" />
   }));

   return (
      <GenericObjectView
         objectId="obj_tasks"
         objectName="Task"
         data={tasks}
         people={people}
         columns={AVAILABLE_COLUMNS} // Provide standard columns
         onAddRecord={() => onOpenQuickTask()}
         onUpdateRecord={onUpdateTask}
         onDeleteRecord={onDeleteTask}

         // Custom Cell Renderer for standard task interactions
         renderCustomCell={(record: any, col: ColumnDefinition) => {
            const task = record as Task;

            if (col.id === 'isCompleted') {
               return (
                  <div className="w-full h-full flex items-center justify-center">
                     <div
                        onClick={(e) => {
                           e.stopPropagation();
                           onUpdateTask({ ...task, isCompleted: !task.isCompleted });
                        }}
                        className="cursor-pointer text-gray-300 hover:text-emerald-500 transition-colors"
                     >
                        {task.isCompleted ? <CheckCircle size={16} className="text-emerald-500" /> : <Circle size={16} />}
                     </div>
                  </div>
               );
            }

            if (col.id === 'title') {
               return (
                  <div
                     className={`w-full h-full px-3 flex items-center font-medium ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                     dangerouslySetInnerHTML={{ __html: task.title }}
                  />
               );
            }

            if (col.id === 'due') {
               return (
                  <div className="w-full h-full px-1" ref={openDatePickerId === task.id ? datePickerRef : null}>
                     <div
                        className="w-full h-full flex items-center px-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-600"
                        onClick={(e) => {
                           e.stopPropagation();
                           setOpenDatePickerId(openDatePickerId === task.id ? null : task.id);
                        }}
                     >
                        {task.dueDate ? (
                           <div className="flex items-center gap-2">
                              <span className="truncate">{new Date(task.dueDate).toLocaleDateString()}</span>
                              {new Date(task.dueDate).getHours() !== 0 && (
                                 <>
                                    <span className="text-gray-300 text-[10px]">•</span>
                                    <span className="text-xs text-gray-500 truncate">
                                       {new Date(task.dueDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                 </>
                              )}
                           </div>
                        ) : <span className="text-gray-300">-</span>}
                     </div>
                     {openDatePickerId !== null && openDatePickerId === task.id && (
                        <DatePickerPopover
                           isOpen={true}
                           date={task.dueDate ? new Date(task.dueDate) : null}
                           onChange={(d) => {
                              const iso = d ? d.toISOString() : null;
                              onUpdateTask({ ...task, dueDate: iso });
                              // Close picker after selection if standard date, or keep open if time? 
                              // Let's keep existing behavior or close it. 
                              // Usually standard is close unless time picking. 
                              // But DatePickerPopover handles its own close often.
                           }}
                           onClose={() => setOpenDatePickerId(null)}
                           triggerRef={datePickerRef}
                           align="left"
                        />
                     )}
                  </div>
               );
            }

            if (col.id === 'record') {
               return (
                  <SearchableSelect
                     value={task.linkedCompanyId}
                     onChange={(val) => onUpdateTask({ ...task, linkedCompanyId: val })}
                     options={companyOptions}
                     className="border-transparent bg-transparent"
                  />
               );
            }

            if (col.id === 'assignee') {
               return (
                  <SearchableSelect
                     value={task.assignedTo}
                     onChange={(val) => onUpdateTask({ ...task, assignedTo: val })}
                     options={userOptions}
                     className="border-transparent bg-transparent"
                  />
               );
            }

            return null; // Fallback to default
         }}

         DetailPanelRequest={({ isOpen, onClose, data, onUpdate }) => (
            <TaskDetailPanel
               task={data}
               isOpen={isOpen}
               onClose={onClose}
               companies={companies}
               people={people || []}
               onUpdate={onUpdate}
               onDelete={onDeleteTask}
            />
         )}
      />
   );
};

export default TasksView;
