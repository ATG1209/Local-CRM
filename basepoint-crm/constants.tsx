
import { Company, Deal, MetricData, WorkflowRun, Person, Task, User } from './types';

const now = new Date();
const daysAgo = (days: number) => new Date(new Date().setDate(now.getDate() - days)).toISOString();
const futureDate = (days: number) => new Date(new Date().setDate(now.getDate() + days)).toISOString();

export const MOCK_USERS: User[] = [
  { id: 'you', name: 'You', avatar: 'https://picsum.photos/32/32?random=99' },
  { id: 'u1', name: 'Sofia Martinez', avatar: 'https://picsum.photos/32/32?random=20' },
  { id: 'u2', name: 'Emily Carter', avatar: 'https://picsum.photos/32/32?random=21' },
  { id: 'u3', name: 'Ethan Blake', avatar: 'https://picsum.photos/32/32?random=22' },
  { id: 'u4', name: 'Lucas Weber', avatar: 'https://picsum.photos/32/32?random=23' },
  { id: 'u5', name: 'Mike Fischer', avatar: 'https://picsum.photos/32/32?random=24' },
];

export const MOCK_PEOPLE: Person[] = [
  {
    id: 'p1',
    name: 'Guillermo Rauch',
    email: 'guillermo@vercel.com',
    avatar: 'https://picsum.photos/32/32?random=100',
    companyId: '1',
    role: 'CEO',
    phone: '+1 555-0101',
    location: 'San Francisco, CA',
    lastInteraction: daysAgo(2),
    connectionStrength: 'Strong',
    createdAt: daysAgo(200)
  },
  {
    id: 'p2',
    name: 'Nat Friedman',
    email: 'nat@github.com',
    avatar: 'https://picsum.photos/32/32?random=101',
    companyId: '3',
    role: 'Advisor',
    phone: '+1 555-0102',
    location: 'San Francisco, CA',
    lastInteraction: daysAgo(7),
    connectionStrength: 'Moderate',
    createdAt: daysAgo(180)
  },
  {
    id: 'p3',
    name: 'Patrick Collison',
    email: 'patrick@stripe.com',
    avatar: 'https://picsum.photos/32/32?random=102',
    companyId: '4',
    role: 'CEO',
    phone: '+1 555-0103',
    location: 'Dublin, Ireland',
    lastInteraction: daysAgo(1),
    connectionStrength: 'Strong',
    createdAt: daysAgo(150)
  },
  {
    id: 'p4',
    name: 'Dylan Field',
    email: 'dylan@figma.com',
    avatar: 'https://picsum.photos/32/32?random=103',
    companyId: '5',
    role: 'CEO',
    location: 'New York, NY',
    lastInteraction: daysAgo(90),
    connectionStrength: 'Weak',
    createdAt: daysAgo(120)
  },
  {
    id: 'p5',
    name: 'Des Traynor',
    email: 'des@intercom.com',
    avatar: 'https://picsum.photos/32/32?random=104',
    companyId: '6',
    role: 'Co-founder',
    phone: '+1 555-0105',
    location: 'Dublin, Ireland',
    lastInteraction: '', // No contact
    connectionStrength: 'None',
    createdAt: daysAgo(100)
  },
  {
    id: 'p6',
    name: 'Steve Mill',
    email: 'steve@vercel.com',
    avatar: 'https://picsum.photos/32/32?random=105',
    companyId: '1',
    role: 'VP Sales',
    phone: '+1 555-0106',
    location: 'Remote',
    lastInteraction: daysAgo(0), // 5 hours ago
    connectionStrength: 'Moderate',
    createdAt: daysAgo(90)
  }
];

export const MOCK_COMPANIES: Company[] = [
  {
    id: '1',
    name: 'Vercel',
    logo: 'https://picsum.photos/24/24?random=1',
    domain: 'vercel.com',
    links: [{ label: 'LinkedIn', url: '#' }, { label: 'Crunchbase', url: '#' }],
    specialOffers: ['Demand Gen', 'AI Max'],
    pointOfContactId: ['p1'],
    notes: 'Key strategic partner for Q3.',
    nextTaskDate: futureDate(5), // Oct 24 approx
    externalId: 'CID-9928',
    loggingStage: ['Call Logged', 'In progress'],
    groundControl: ['To Keep'],
    sensitiveVertical: false,
    quarters: 'Q1 2026',
    nal: false,
    createdAt: daysAgo(300)
  },
  {
    id: '2',
    name: 'DigitalOcean',
    logo: 'https://picsum.photos/24/24?random=2',
    domain: 'digitalocean.com',
    links: [{ label: 'Website', url: '#' }],
    specialOffers: ['Launch P MAX'],
    pointOfContactId: [],
    notes: 'Discussing infrastructure overhaul.',
    nextTaskDate: futureDate(1), // Tomorrow
    externalId: 'CID-1120',
    loggingStage: ['Email Logged'],
    groundControl: ['Rollover'],
    sensitiveVertical: true,
    quarters: 'Q4 2025',
    nal: true,
    createdAt: daysAgo(280)
  },
  {
    id: '3',
    name: 'GitHub',
    logo: 'https://picsum.photos/24/24?random=3',
    domain: 'github.com',
    links: [{ label: 'GitHub', url: '#' }],
    specialOffers: ['NCA', 'ECL'],
    pointOfContactId: ['p2'],
    notes: '',
    nextTaskDate: null,
    externalId: 'CID-3321',
    loggingStage: ['Call scheduled'],
    groundControl: ['To Remove'],
    sensitiveVertical: false,
    quarters: 'Q1 2026',
    nal: false,
    createdAt: daysAgo(250)
  },
  {
    id: '4',
    name: 'Stripe',
    logo: 'https://picsum.photos/24/24?random=4',
    domain: 'stripe.com',
    links: [],
    specialOffers: ['VBB', 'Smart Bid'],
    pointOfContactId: ['p3'],
    notes: 'Waiting on legal review.',
    nextTaskDate: futureDate(30), // Nov 01 approx
    externalId: 'CID-5543',
    loggingStage: ['Standby'],
    groundControl: ['To Keep'],
    sensitiveVertical: true,
    quarters: 'Q2 2026',
    nal: false,
    createdAt: daysAgo(220)
  },
  {
    id: '5',
    name: 'Figma',
    logo: 'https://picsum.photos/24/24?random=5',
    domain: 'figma.com',
    links: [{ label: 'Design System', url: '#' }],
    specialOffers: ['Gateway'],
    pointOfContactId: ['p4'],
    notes: 'Renewal discussion pending.',
    nextTaskDate: futureDate(0), // Today
    externalId: 'CID-8877',
    loggingStage: ['Call Logged'],
    groundControl: ['To Keep'],
    sensitiveVertical: false,
    quarters: 'Q3 2025',
    nal: false,
    createdAt: daysAgo(200)
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: '1',
    type: 'task',
    title: 'Prepare quarterly review deck',
    isCompleted: false,
    dueDate: new Date(new Date().setDate(new Date().getDate() - 6)), // 6 days ago
    assignedTo: 'you',
    createdBy: 'you',
    createdAt: new Date(daysAgo(10)),
    linkedCompanyId: '1' // Vercel
  },
  {
    id: '2',
    type: 'task',
    title: 'Email Patrick regarding API access',
    isCompleted: false,
    dueDate: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
    assignedTo: 'u1',
    createdBy: 'you',
    createdAt: new Date(daysAgo(9)),
    linkedCompanyId: '4' // Stripe
  },
  {
    id: '3',
    type: 'task',
    title: 'Schedule demo with Figma team',
    isCompleted: false,
    dueDate: new Date(), // Today
    assignedTo: 'u2',
    createdBy: 'u1',
    createdAt: new Date(daysAgo(5)),
    linkedCompanyId: '5' // Figma
  },
  {
    id: '4',
    type: 'task',
    title: 'Update billing information',
    isCompleted: true,
    dueDate: new Date(new Date().setDate(new Date().getDate() - 2)),
    assignedTo: 'you',
    createdBy: 'you',
    createdAt: new Date(daysAgo(4)),
    linkedCompanyId: '2' // DigitalOcean
  }
];

export const MOCK_DEALS: Deal[] = [
  { id: '1', companyName: 'Loom', companyLogo: 'https://picsum.photos/24/24?random=10', ownerName: 'Sofia Martinez', ownerAvatar: 'https://picsum.photos/32/32?random=20', value: 20700.00, stage: 'Lead', tags: ['Pro'], lastActivity: 'Jan 17, 2024', comments: 1, tasks: 1 },
  { id: '2', companyName: 'Vercel - Expansion', companyLogo: 'https://picsum.photos/24/24?random=1', ownerName: 'Emily Carter', ownerAvatar: 'https://picsum.photos/32/32?random=21', value: 45000.00, stage: 'Lead', tags: [], lastActivity: 'Jan 19, 2024', comments: 0, tasks: 0 },
  { id: '3', companyName: 'GitHub - x20 Enterprise', companyLogo: 'https://picsum.photos/24/24?random=3', ownerName: 'Ethan Blake', ownerAvatar: 'https://picsum.photos/32/32?random=22', value: 13500.00, stage: 'Contacted', tags: ['Enterprise'], lastActivity: 'Dec 21, 2024', comments: 2, tasks: 8 },
  { id: '4', companyName: 'Slack - Expansion', companyLogo: 'https://picsum.photos/24/24?random=9', ownerName: 'Emily Carter', ownerAvatar: 'https://picsum.photos/32/32?random=21', value: 85000.00, stage: 'Contacted', tags: [], lastActivity: 'Feb 01, 2025', comments: 5, tasks: 2 },
  { id: '5', companyName: 'Stripe', companyLogo: 'https://picsum.photos/24/24?random=4', ownerName: 'Lucas Weber', ownerAvatar: 'https://picsum.photos/32/32?random=23', value: 30620.00, stage: 'Qualification', tags: ['Plus'], lastActivity: 'Jan 17, 2025', comments: 6, tasks: 0 },
  { id: '6', companyName: 'Customer.io - x10 Plus', companyLogo: 'https://picsum.photos/24/24?random=11', ownerName: 'Mike Fischer', ownerAvatar: 'https://picsum.photos/32/32?random=24', value: 12000.00, stage: 'Qualification', tags: [], lastActivity: 'Jan 28, 2025', comments: 1, tasks: 3 },
  { id: '7', companyName: 'Figma', companyLogo: 'https://picsum.photos/24/24?random=5', ownerName: 'Mike Fischer', ownerAvatar: 'https://picsum.photos/32/32?random=24', value: 18000.00, stage: 'Evaluation', tags: ['Enterprise'], lastActivity: 'Oct 26, 2024', comments: 1, tasks: 1 },
  { id: '8', companyName: 'Linear - Expansion', companyLogo: 'https://picsum.photos/24/24?random=12', ownerName: 'Ethan Blake', ownerAvatar: 'https://picsum.photos/32/32?random=22', value: 5000.00, stage: 'Evaluation', tags: [], lastActivity: 'Nov 12, 2024', comments: 4, tasks: 2 },
];

export const REVENUE_DATA: MetricData[] = [
  { name: 'Jan', uv: 1000, pv: 2400, amt: 2400 },
  { name: 'Feb', uv: 1500, pv: 1398, amt: 2210 },
  { name: 'Mar', uv: 2000, pv: 3000, amt: 2290 },
  { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
  { name: 'Aug', uv: 3000, pv: 7000, amt: 2100 },
  { name: 'Sep', uv: 2000, pv: 4100, amt: 2100 },
];

export const WORKFLOW_RUNS: WorkflowRun[] = [
  { id: 70, status: 'Executing', time: 'Executing', credits: 0 },
  { id: 69, status: 'Completed', time: 'Completed just now', credits: 15 },
  { id: 68, status: 'Completed', time: 'Completed 2 min ago', credits: 11 },
  { id: 67, status: 'Completed', time: 'Completed 3 min ago', credits: 11 },
  { id: 66, status: 'Completed', time: 'Completed 5 min ago', credits: 16 },
  { id: 65, status: 'Completed', time: 'Completed 6 min ago', credits: 14 },
];
