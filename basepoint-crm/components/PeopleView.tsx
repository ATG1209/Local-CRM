import React from 'react';
import { Person, Company } from '../types';
import GenericObjectView from './GenericObjectView';
import PersonDetailPanel from './PersonDetailPanel';

interface PeopleViewProps {
   people: Person[];
   companies: Company[];
   onAddPerson: (person: Person) => void;
   onUpdatePerson: (person: Person) => void;
   onDeletePerson: (id: string) => void;
}

const PeopleView: React.FC<PeopleViewProps> = ({
   people,
   companies,
   onAddPerson,
   onUpdatePerson,
   onDeletePerson
}) => {
   return (
      <GenericObjectView
         objectId="obj_people"
         objectName="Person"
         data={people}
         people={people}
         onAddRecord={onAddPerson}
         onUpdateRecord={onUpdatePerson}
         onDeleteRecord={onDeletePerson}
         DetailPanelRequest={({ isOpen, onClose, data, onUpdate, columns, people, onEditAttribute, onAddProperty }) => (
            <PersonDetailPanel
               isOpen={isOpen}
               onClose={onClose}
               person={data}
               onUpdate={onUpdate}
               people={people || []}
               companies={companies}
               columns={columns}
               onEditAttribute={onEditAttribute}
               onAddProperty={onAddProperty}
            />
         )}
      />
   );
};

export default PeopleView;
