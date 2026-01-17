import React from 'react';
import { Company, Activity, Person, ColumnDefinition } from '../types';
import GenericObjectView from './GenericObjectView';
import CompanyDetailPanel from './CompanyDetailPanel';
import { computeCompanyAlert, AlertSegment, AlertSeverity } from '../utils/companyAlert';
import * as LucideIcons from 'lucide-react';

interface CompaniesViewProps {
   companies: Company[];
   activities: Activity[];
   people: Person[];
   onAddCompany: (company: Company) => void;
   onUpdateCompany: (company: Company) => void;
   onDeleteCompany: (id: string) => void;
   onUpdateActivity: (activity: Activity) => void;
   onDeleteActivity: (id: string) => void;
   onUpdatePerson: (person: Person) => void;
   onDeletePerson: (id: string) => void;
   initialViewId?: string;
   onViewFavoriteChange?: () => void;
   initialRecordId?: string;
}

const AlertPill: React.FC<{ segment: AlertSegment }> = ({ segment }) => {
   const Icon = (LucideIcons as any)[segment.icon] || (LucideIcons as any)[segment.icon.replace('Circle', 'Circle2')] || LucideIcons.HelpCircle;

   const severityStyles: Record<AlertSeverity, string> = {
      danger: 'bg-red-50 text-red-700 border-red-100',
      warning: 'bg-amber-50 text-amber-700 border-amber-100',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      neutral: 'bg-gray-50 text-gray-700 border-gray-100',
      info: 'bg-blue-50 text-blue-800 border-blue-100'
   };

   return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${severityStyles[segment.severity]}`}>
         <Icon size={14} strokeWidth={2.5} className="opacity-90" />
         <span className="leading-none">{segment.text}</span>
      </div>
   );
};

import { formatDistanceToNow, differenceInCalendarDays } from 'date-fns';
import { RefreshCcw, Calendar as CalendarIcon } from 'lucide-react';
import DatePickerPopover from './DatePickerPopover';

const LogTouchCell = ({
   record,
   col,
   onUpdate
}: {
   record: any;
   col: ColumnDefinition;
   onUpdate: (r: any) => void;
}) => {
   const [isPickerOpen, setIsPickerOpen] = React.useState(false);
   const triggerRef = React.useRef<HTMLButtonElement>(null);

   const value = record[col.accessorKey];
   let loggedDate = value ? new Date(value) : null;

   // Validate date
   if (loggedDate && isNaN(loggedDate.getTime())) {
      loggedDate = null;
   }

   // Logic: Incremental time with urgency colors
   let statusText = 'Never logged';
   let colorClass = 'text-gray-400 italic'; // Default for null/never

   if (loggedDate) {
      const daysSince = differenceInCalendarDays(new Date(), loggedDate);

      if (daysSince === 0) {
         statusText = 'Today';
      } else if (daysSince === 1) {
         statusText = 'Yesterday';
      } else {
         statusText = `${daysSince} days ago`;
      }

      if (daysSince >= 14) {
         colorClass = 'text-red-600 font-medium'; // Overdue
      } else if (daysSince >= 10) {
         colorClass = 'text-yellow-600 font-medium'; // Warning
      } else {
         colorClass = 'text-gray-700'; // Fine
      }
   }

   return (
      <div className="flex items-center gap-2 w-full h-full px-3 group">
         {/* Quick Log Button - Always visible */}
         <button
            type="button"
            onClick={(e) => {
               e.stopPropagation();
               onUpdate({ ...record, [col.accessorKey]: Date.now() });
            }}
            className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
            title="Log touch now"
         >
            <RefreshCcw size={12} />
         </button>

         <div className="flex-1 flex items-center justify-between min-w-0">
            <span
               className={`text-sm truncate cursor-pointer hover:underline ${colorClass}`}
               onClick={(e) => { e.stopPropagation(); setIsPickerOpen(true); }}
               title={loggedDate ? loggedDate.toLocaleDateString() : 'No date set'}
            >
               {statusText}
            </span>

            {/* Calendar Icon */}
            <button
               ref={triggerRef}
               onClick={(e) => { e.stopPropagation(); setIsPickerOpen(true); }}
               className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
               <CalendarIcon size={12} />
            </button>
         </div>

         <DatePickerPopover
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            date={loggedDate}
            onChange={(date) => {
               if (date) {
                  onUpdate({ ...record, [col.accessorKey]: date.getTime() });
               }
            }}
            triggerRef={triggerRef}
         />
      </div>
   );
};

const CompaniesView: React.FC<CompaniesViewProps> = ({
   companies,
   activities,
   people,
   onAddCompany,
   onUpdateCompany,
   onDeleteCompany,
   onUpdateActivity,
   onDeleteActivity,
   onUpdatePerson,
   onDeletePerson,
   initialViewId,
   onViewFavoriteChange,
   initialRecordId
}) => {
   // Define the alert column
   const alertColumn: ColumnDefinition = {
      id: 'computed_alerts',
      label: 'Health & Coverage',
      type: 'text',
      accessorKey: 'computed_alerts',
      visible: true,
      isSystem: true,
      readonly: true,
      width: 320
   };

   // Enrich companies with computed alerts
   const companiesWithAlerts = React.useMemo(() => {
      return companies.map(company => ({
         ...company,
         computed_alerts: computeCompanyAlert(company, activities)
      }));
   }, [companies, activities]);

   const renderCustomCell = (record: any, col: ColumnDefinition) => {
      if (col.id === 'computed_alerts') {
         const segments = record.computed_alerts as AlertSegment[];
         return (
            <div className="flex flex-nowrap gap-1.5 px-3 py-1 overflow-x-auto">
               {segments.map((segment, idx) => (
                  <AlertPill key={idx} segment={segment} />
               ))}
            </div>
         );
      }

      // Log Touch Control for Table View
      const isLogTouchField = col.accessorKey === 'lastLoggedAt' ||
         col.id === 'lastLoggedAt' ||
         (col.label && col.label.toLowerCase().includes('last logged'));

      if (isLogTouchField) {
         return (
            <LogTouchCell
               record={record}
               col={col}
               onUpdate={onUpdateCompany}
            />
         );
      }

      return null;
   };

   return (
      <GenericObjectView
         objectId="obj_companies"
         objectName="Company"
         data={companiesWithAlerts}
         people={people}
         onAddRecord={onAddCompany}
         onUpdateRecord={onUpdateCompany}
         onDeleteRecord={onDeleteCompany}
         initialViewId={initialViewId}
         initialRecordId={initialRecordId}
         onViewFavoriteChange={onViewFavoriteChange}
         columns={[alertColumn]} // Pass custom columns to be merged
         renderCustomCell={renderCustomCell}
         DetailPanelRequest={({ isOpen, onClose, data, onUpdate, columns, people, onEditAttribute, onAddProperty, onToggleVisibility }) => (
            <CompanyDetailPanel
               isOpen={isOpen}
               onClose={onClose}
               company={data}
               onUpdate={onUpdate}
               companies={companies}
               people={people || []}
               activities={activities}
               columns={columns}
               onEditAttribute={onEditAttribute}
               onAddProperty={onAddProperty}
               onToggleVisibility={onToggleVisibility}
               onUpdateActivity={onUpdateActivity}
               onDeleteActivity={onDeleteActivity}
               onUpdatePerson={onUpdatePerson}
               onDeletePerson={onDeletePerson}
            />
         )}
      />
   );
};

export default CompaniesView;
