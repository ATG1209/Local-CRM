import React from 'react';
import { Person, Company, Activity } from '../types';
import GenericObjectView from './GenericObjectView';
import PersonDetailPanel from './PersonDetailPanel';

interface PeopleViewProps {
   people: Person[];
   companies: Company[];
   activities: Activity[];
   onAddPerson: (person: Person) => void;
   onUpdatePerson: (person: Person) => void;
   onDeletePerson: (id: string) => void;
   onUpdateActivity: (activity: Activity) => void;
   onDeleteActivity: (id: string) => void;
   initialViewId?: string;
   onViewFavoriteChange?: () => void;
   initialRecordId?: string;
}

const PeopleView: React.FC<PeopleViewProps> = ({
   people,
   companies,
   activities,
   onAddPerson,
   onUpdatePerson,
   onDeletePerson,
   onUpdateActivity,
   onDeleteActivity,
   initialViewId,
   onViewFavoriteChange,
   initialRecordId
}) => {
   return (
      <GenericObjectView
         objectId="obj_people"
         objectName="Person"
         data={people}
         people={people}
         companies={companies}
         onAddRecord={onAddPerson}
         onUpdateRecord={onUpdatePerson}
         onDeleteRecord={onDeletePerson}
         initialViewId={initialViewId}
         initialRecordId={initialRecordId}
         onViewFavoriteChange={onViewFavoriteChange}
         DetailPanelRequest={({ isOpen, onClose, data, onUpdate, columns, people, onEditAttribute, onAddProperty, onToggleVisibility }) => (
            <PersonDetailPanel
               isOpen={isOpen}
               onClose={onClose}
               person={data}
               onUpdate={onUpdate}
               people={people || []}
               companies={companies}
               activities={activities}
               columns={columns}
               onEditAttribute={onEditAttribute}
               onAddProperty={onAddProperty}
               onToggleVisibility={onToggleVisibility}
               onUpdateActivity={onUpdateActivity}
               onDeleteActivity={onDeleteActivity}
            />
         )}
      />
   );
};

export default PeopleView;
