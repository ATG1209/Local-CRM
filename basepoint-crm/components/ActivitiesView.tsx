import React, { useState, useRef } from 'react';
import { Activity, ActivityType, ACTIVITY_TYPE_CONFIGS, Company, Person, ColumnDefinition, SavedView, ACTIVITY_COLUMNS } from '../types';
import GenericObjectView from './GenericObjectView';
import TaskDetailPanel from './TaskDetailPanel';
import DatePickerPopover from './DatePickerPopover';
import SearchableSelect from './SearchableSelect';
import CompanyAvatar from './CompanyAvatar';
import {
   CheckCircle,
   Circle,
   CheckSquare,
   Phone,
   Calendar as CalendarIcon
} from 'lucide-react';

interface ActivitiesViewProps {
   activities: Activity[];
   companies: Company[];
   people: Person[];
   onAddActivity: (activity: Activity) => void;
   onUpdateActivity: (activity: Activity) => void;
   onDeleteActivity: (id: string) => void;
   onOpenQuickActivity: () => void;
   newActivityTrigger?: number;
   initialViewId?: string;
   onViewFavoriteChange?: () => void;
   initialRecordId?: string;
}



const ActivitiesView: React.FC<ActivitiesViewProps> = ({
   activities,
   companies,
   people,
   onAddActivity,
   onUpdateActivity,
   onDeleteActivity,
   onOpenQuickActivity,
   newActivityTrigger,
   initialViewId,
   initialRecordId,
   onViewFavoriteChange
}) => {

   // State for date picker management
   const [openDatePickerId, setOpenDatePickerId] = useState<string | null>(null);
   const datePickerRef = useRef<HTMLDivElement>(null);

   // Icon mapper
   const iconMap = {
      CheckSquare,
      Phone,
      Calendar: CalendarIcon
   };

   React.useEffect(() => {
      if (newActivityTrigger) {
         onOpenQuickActivity();
      }
   }, [newActivityTrigger, onOpenQuickActivity]);

   const companyOptions = companies.map(c => ({
      id: c.id,
      label: c.name,
      icon: <CompanyAvatar name={c.name} size="xs" />
   }));

   const personOptions = people.map(p => ({
      id: p.id,
      label: p.name,
   }));

   const userOptions = people.map(u => ({
      id: u.id,
      label: u.name,
      icon: <img src={u.avatar} className="w-4 h-4 rounded-full" alt="" />
   }));

   return (
      <GenericObjectView
         objectId="obj_activities"
         objectName="Activity"
         data={activities}
         people={people}
         companies={companies}
         columns={ACTIVITY_COLUMNS}
         onAddRecord={() => onOpenQuickActivity()}
         onUpdateRecord={onUpdateActivity}
         onDeleteRecord={onDeleteActivity}
         initialViewId={initialViewId}
         initialRecordId={initialRecordId}
         onViewFavoriteChange={onViewFavoriteChange}

         // Custom Cell Renderer for activity-specific interactions
         renderCustomCell={(record: any, col: ColumnDefinition) => {
            const activity = record as Activity;

            if (col.id === 'type') {
               const config = ACTIVITY_TYPE_CONFIGS[activity.type];
               const Icon = iconMap[config.icon as keyof typeof iconMap];

               return (
                  <div className="w-full h-full px-3 flex items-center gap-2">
                     <div className={`p-1 rounded bg-${config.color}-100`}>
                        <Icon size={14} className={`text-${config.color}-600`} />
                     </div>
                     <span className={`text-sm font-medium text-${config.color}-700`}>
                        {config.label}
                     </span>
                  </div>
               );
            }

            if (col.id === 'isCompleted') {
               return (
                  <div className="w-full h-full flex items-center justify-center">
                     <div
                        onClick={(e) => {
                           e.stopPropagation();
                           onUpdateActivity({ ...activity, isCompleted: !activity.isCompleted });
                        }}
                        className="cursor-pointer text-gray-300 hover:text-emerald-500 transition-colors"
                     >
                        {activity.isCompleted ? <CheckCircle size={16} className="text-emerald-500" /> : <Circle size={16} />}
                     </div>
                  </div>
               );
            }

            if (col.id === 'title') {
               return (
                  <div
                     className={`w-full h-full px-3 flex items-center font-medium ${activity.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                  >
                     {activity.title}
                  </div>
               );
            }

            if (col.id === 'due') {
               return (
                  <div className="w-full h-full px-1" ref={openDatePickerId === activity.id ? datePickerRef : null}>
                     <div
                        className="w-full h-full flex items-center px-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-600"
                        onClick={(e) => {
                           e.stopPropagation();
                           setOpenDatePickerId(openDatePickerId === activity.id ? null : activity.id);
                        }}
                     >
                        {activity.dueDate ? (
                           <div className="flex items-center gap-2">
                              <span className="truncate">{new Date(activity.dueDate).toLocaleDateString()}</span>
                              {new Date(activity.dueDate).getHours() !== 0 && (
                                 <>
                                    <span className="text-gray-300 text-[10px]">•</span>
                                    <span className="text-xs text-gray-500 truncate">
                                       {new Date(activity.dueDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                 </>
                              )}
                           </div>
                        ) : <span className="text-gray-300">-</span>}
                     </div>
                     {openDatePickerId !== null && openDatePickerId === activity.id && (
                        <DatePickerPopover
                           isOpen={true}
                           date={activity.dueDate || null}
                           onChange={(d) => {
                              onUpdateActivity({ ...activity, dueDate: d });
                           }}
                           onClose={() => setOpenDatePickerId(null)}
                           triggerRef={datePickerRef}
                           align="left"
                        />
                     )}
                  </div>
               );
            }

            if (col.id === 'company') {
               return (
                  <SearchableSelect
                     value={activity.linkedCompanyId}
                     onChange={(val) => onUpdateActivity({ ...activity, linkedCompanyId: val })}
                     options={companyOptions}
                     className="border-transparent bg-transparent"
                  />
               );
            }

            if (col.id === 'person') {
               return (
                  <SearchableSelect
                     value={activity.linkedPersonId}
                     onChange={(val) => onUpdateActivity({ ...activity, linkedPersonId: val })}
                     options={personOptions}
                     className="border-transparent bg-transparent"
                  />
               );
            }

            if (col.id === 'assignee') {
               return (
                  <SearchableSelect
                     value={activity.assignedTo}
                     onChange={(val) => onUpdateActivity({ ...activity, assignedTo: val })}
                     options={userOptions}
                     className="border-transparent bg-transparent"
                  />
               );
            }

            return null; // Fallback to default
         }}

         DetailPanelRequest={({ isOpen, onClose, data, onUpdate, columns, onEditAttribute, onAddProperty, onToggleVisibility }) => (
            <TaskDetailPanel
               task={data}
               isOpen={isOpen}
               onClose={onClose}
               companies={companies}
               people={people || []}
               onUpdate={onUpdate}
               onDelete={onDeleteActivity}
               columns={columns}
               onEditAttribute={onEditAttribute}
               onAddProperty={onAddProperty}
               onToggleVisibility={onToggleVisibility}
            />
         )}
      />
   );
};

export default ActivitiesView;
