import React from 'react';
import { Company, Task, Person } from '../types';
import GenericObjectView from './GenericObjectView';
import CompanyDetailPanel from './CompanyDetailPanel';

interface CompaniesViewProps {
   companies: Company[];
   tasks: Task[];
   people: Person[];
   onAddCompany: (company: Company) => void;
   onUpdateCompany: (company: Company) => void;
   onDeleteCompany: (id: string) => void;
   initialViewId?: string;
   onViewFavoriteChange?: () => void;
}

const CompaniesView: React.FC<CompaniesViewProps> = ({
   companies,
   tasks,
   people,
   onAddCompany,
   onUpdateCompany,
   onDeleteCompany,
   initialViewId,
   onViewFavoriteChange
}) => {
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
         DetailPanelRequest={({ isOpen, onClose, data, onUpdate, columns, people, onEditAttribute, onAddProperty, onToggleVisibility }) => (
            <CompanyDetailPanel
               isOpen={isOpen}
               onClose={onClose}
               company={data}
               onUpdate={onUpdate}
               people={people || []}
               columns={columns}
               onEditAttribute={onEditAttribute}
               onAddProperty={onAddProperty}
               onToggleVisibility={onToggleVisibility}
            />
         )}
      />
   );
};

export default CompaniesView;
