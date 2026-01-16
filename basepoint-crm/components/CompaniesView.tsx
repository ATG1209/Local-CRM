import React from 'react';
import { Company, Activity, Person } from '../types';
import GenericObjectView from './GenericObjectView';
import CompanyDetailPanel from './CompanyDetailPanel';
import { computeCompanyAlert, AlertSeverity, AlertSegment } from '../utils/alertHelper';
import {
   Calendar,
   CalendarX,
   ListX,
   CheckSquare,
   AlertCircle,
   CheckCircle,
   Disc,
   History,
   CalendarClock
} from 'lucide-react';

const AlertIcon = ({ name, className }: { name: string, className?: string }) => {
   const size = 14;
   switch (name) {
      case 'CalendarX': return <CalendarX size={size} className={className} />;
      case 'Calendar': return <Calendar size={size} className={className} />;
      case 'CalendarClock': return <CalendarClock size={size} className={className} />;
      case 'ListX': return <ListX size={size} className={className} />;
      case 'Exclude': return <ListX size={size} className={className} />; // Fallback
      case 'CheckSquare': return <CheckSquare size={size} className={className} />;
      case 'AlertCircle': return <AlertCircle size={size} className={className} />;
      case 'CheckCircle': return <CheckCircle size={size} className={className} />;
      case 'Disc': return <Disc size={size} className={className} />;
      case 'History': return <History size={size} className={className} />;
      default: return <Calendar size={size} className={className} />;
   }
};

const AlertPill: React.FC<{ segment: AlertSegment }> = ({ segment }) => {
   const severityColors: Record<AlertSeverity, string> = {
      danger: "bg-red-100 text-red-700 border-red-200",
      warning: "bg-amber-100 text-amber-700 border-amber-200",
      info: "bg-blue-100 text-blue-700 border-blue-200",
      success: "bg-green-100 text-green-700 border-green-200",
      neutral: "bg-gray-100 text-gray-700 border-gray-200"
   };

   return (
      <div
         className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium whitespace-nowrap ${severityColors[segment.severity]}`}
         title={segment.text}
      >
         <AlertIcon name={segment.icon} />
         <span>{segment.text}</span>
      </div>
   );
};

interface CompaniesViewProps {
   companies: Company[];
   activities: Activity[];
   people: Person[];
   onAddCompany: (company: Company) => void;
   onUpdateCompany: (company: Company) => void;
   onDeleteCompany: (id: string) => void;
   initialViewId?: string;
   onViewFavoriteChange?: () => void;
   onLogTouch?: (companyId: string) => void;
}

const CompaniesView: React.FC<CompaniesViewProps> = ({
   companies,
   activities,
   people,
   onAddCompany,
   onUpdateCompany,
   onDeleteCompany,
   initialViewId,
   onViewFavoriteChange,
   onLogTouch
}) => {
   const renderAlerts = (company: Company) => {
      if (!company) return null;
      const alert = computeCompanyAlert(company, activities);
      return (
         <div className="flex items-center gap-2 flex-wrap">
            {alert.segments.map((seg, i) => (
               <AlertPill key={i} segment={seg} />
            ))}
         </div>
      );
   };

   // Inject "Alert" column if not present? 
   // Actually GenericObjectView expects columns. We can override or let it assume attributes.
   // But Alert is computed. We need to pass a custom column definition or rely on "renderCustomCell" to hijack a specific column ID.
   // Let's assume we want to show it as a specific column.
   // We can use a "virtual" column definition.



   return (
      <GenericObjectView
         objectId="obj_companies"
         objectName="Company"
         data={companies}
         people={people}
         onAddRecord={onAddCompany}
         onUpdateRecord={onUpdateCompany}
         onDeleteRecord={onDeleteCompany}
         initialViewId={initialViewId}
         onViewFavoriteChange={onViewFavoriteChange}
         columns={[{
            id: 'alert',
            label: 'Alert',
            type: 'text', // Use 'text' type but we hijack rendering
            accessorKey: 'alert',
            visible: true,
            width: 300,
            readonly: true,
            isSystem: true
         }]}
         renderCustomCell={(record, col) => {
            if (col.id === 'alert') {
               return renderAlerts(record as Company);
            }
            return null;
         }}
         DetailPanelRequest={({ isOpen, onClose, data, onUpdate, columns, people, onEditAttribute, onAddProperty, onToggleVisibility }) => (
            <CompanyDetailPanel
               isOpen={isOpen}
               onClose={onClose}
               company={data}
               onUpdate={onUpdate}
               people={people || []}
               activities={activities}
               columns={columns}
               onEditAttribute={onEditAttribute}
               onAddProperty={onAddProperty}
               onToggleVisibility={onToggleVisibility}
               onLogTouch={onLogTouch}
               computedAlert={computeCompanyAlert(data, activities)}
            />
         )}
      />
   );
};

export default CompaniesView;
