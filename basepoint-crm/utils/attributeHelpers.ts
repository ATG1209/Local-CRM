import { Attribute } from './schemaApi';
import { ColumnDefinition } from '../types';

/**
 * Legacy mapping for system attributes to match existing JSON data structure
 */
const SYSTEM_KEY_MAPPING: Record<string, string> = {
    // Companies
    'attr_comp_name': 'name',
    'attr_comp_domain': 'domain',
    'attr_comp_poc': 'pointOfContactId',
    'attr_comp_stage': 'loggingStage',
    'attr_comp_next_task': 'nextTaskDate',
    'attr_comp_offers': 'specialOffers',
    'attr_comp_ground': 'groundControl',
    'attr_comp_quarter': 'quarters',
    'attr_comp_ext_id': 'externalId',

    // People
    'attr_ppl_name': 'name',
    'attr_ppl_email': 'email',
    'attr_ppl_company': 'companyId',
    'attr_ppl_role': 'role',
    'attr_ppl_phone': 'phone',
    'attr_ppl_location': 'location',

    // Tasks
    'attr_task_title': 'title',
    'attr_task_completed': 'isCompleted',
    'attr_task_due': 'dueDate',
    'attr_task_company': 'linkedCompanyId',
};

/**
 * Converts an Attribute from the flexible schema to a ColumnDefinition for table views
 */
export const attributeToColumn = (attr: Attribute): ColumnDefinition => {
    // Use mapped key for system attributes, otherwise use attribute ID
    const accessorKey = SYSTEM_KEY_MAPPING[attr.id] || attr.id;

    return {
        id: attr.id,
        label: attr.name,
        type: attr.type as any, // Type conversion
        accessorKey: accessorKey,
        visible: true, // Default to visible
        isSystem: attr.isSystem,
        readonly: attr.isSystem && attr.name === 'Creation date', // Only some system fields are readonly
        options: attr.config?.options || undefined,
        description: '',
        width: getDefaultWidth(attr.type),
    };
};

const getDefaultWidth = (type: string): number => {
    switch (type) {
        case 'checkbox': return 60;
        case 'date': return 140;
        case 'timestamp': return 180;
        case 'number': return 100;
        case 'currency': return 120;
        case 'rating': return 120;
        case 'email': return 200;
        case 'phone': return 150;
        case 'url': return 180;
        case 'relation': return 200;
        default: return 180;
    }
};
