// ── Demo Mode Mock Data ────────────────────────────────────────────────────────
// Completely isolated from real user data. Used only by /demo route.

export const DEMO_MEMBERS = [
  { userId: 'demo-u1', name: 'Alex Rivera',   email: 'alex@demo.com',   role: 'admin'  },
  { userId: 'demo-u2', name: 'Priya Sharma',  email: 'priya@demo.com',  role: 'member' },
  { userId: 'demo-u3', name: 'Marcus Chen',   email: 'marcus@demo.com', role: 'member' },
];

export const DEMO_PROJECTS = [
  {
    id:          'demo-proj-1',
    name:        'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and animations.',
    memberIds:   ['demo-u1', 'demo-u2', 'demo-u3'],
    members:     DEMO_MEMBERS,
    createdAt:   '2024-03-01T10:00:00.000Z',
  },
  {
    id:          'demo-proj-2',
    name:        'Mobile App Launch',
    description: 'Build and launch the iOS and Android applications by Q2.',
    memberIds:   ['demo-u1', 'demo-u2'],
    members:     DEMO_MEMBERS.slice(0, 2),
    createdAt:   '2024-03-15T10:00:00.000Z',
  },
];

const now = new Date();
const d = (offset) => new Date(now.getTime() + offset * 86400000).toISOString().slice(0, 10);

export const DEMO_TASKS_BY_PROJECT = {
  'demo-proj-1': [
    { id: 'dt1', title: 'Design system setup',       description: 'Color palette, typography and component library.',    status: 'done',       priority: 'high',   assignedTo: 'demo-u1', dueDate: d(-5),  projectId: 'demo-proj-1', createdAt: '2024-03-02T00:00:00Z', updatedAt: '2024-03-10T00:00:00Z' },
    { id: 'dt2', title: 'Homepage hero section',     description: 'Animated hero with gradient background.',             status: 'done',       priority: 'high',   assignedTo: 'demo-u2', dueDate: d(-3),  projectId: 'demo-proj-1', createdAt: '2024-03-05T00:00:00Z', updatedAt: '2024-03-12T00:00:00Z' },
    { id: 'dt3', title: 'Navigation redesign',       description: 'Responsive nav with mobile hamburger menu.',          status: 'inprogress', priority: 'medium', assignedTo: 'demo-u1', dueDate: d(2),   projectId: 'demo-proj-1', createdAt: '2024-03-08T00:00:00Z', updatedAt: '2024-03-15T00:00:00Z' },
    { id: 'dt4', title: 'Blog section with filters', description: 'Dynamic blog with tag filtering and pagination.',     status: 'inprogress', priority: 'medium', assignedTo: 'demo-u3', dueDate: null,   projectId: 'demo-proj-1', createdAt: '2024-03-10T00:00:00Z', updatedAt: '2024-03-16T00:00:00Z' },
    { id: 'dt5', title: 'Contact form + email',      description: 'Form with validation and email service integration.', status: 'todo',       priority: 'low',    assignedTo: null,       dueDate: d(8),   projectId: 'demo-proj-1', createdAt: '2024-03-12T00:00:00Z', updatedAt: '2024-03-12T00:00:00Z' },
    { id: 'dt6', title: 'SEO & performance audit',   description: 'Meta tags, sitemap, Lighthouse score > 90.',         status: 'todo',       priority: 'high',   assignedTo: 'demo-u2', dueDate: d(12),  projectId: 'demo-proj-1', createdAt: '2024-03-14T00:00:00Z', updatedAt: '2024-03-14T00:00:00Z' },
  ],
  'demo-proj-2': [
    { id: 'dt7',  title: 'UI wireframes (Figma)',    description: 'All key screens wireframed and reviewed.',           status: 'done',       priority: 'high',   assignedTo: 'demo-u1', dueDate: d(-8),  projectId: 'demo-proj-2', createdAt: '2024-03-16T00:00:00Z', updatedAt: '2024-03-22T00:00:00Z' },
    { id: 'dt8',  title: 'Authentication flow',      description: 'OAuth + biometric login for iOS and Android.',       status: 'inprogress', priority: 'high',   assignedTo: 'demo-u2', dueDate: d(3),   projectId: 'demo-proj-2', createdAt: '2024-03-18T00:00:00Z', updatedAt: '2024-03-25T00:00:00Z' },
    { id: 'dt9',  title: 'Push notifications',       description: 'Firebase Cloud Messaging integration.',              status: 'todo',       priority: 'medium', assignedTo: null,       dueDate: d(15),  projectId: 'demo-proj-2', createdAt: '2024-03-20T00:00:00Z', updatedAt: '2024-03-20T00:00:00Z' },
    { id: 'dt10', title: 'App Store submission',     description: 'Prepare assets, screenshots, and submit for review.',status: 'todo',       priority: 'medium', assignedTo: 'demo-u1', dueDate: d(20),  projectId: 'demo-proj-2', createdAt: '2024-03-22T00:00:00Z', updatedAt: '2024-03-22T00:00:00Z' },
  ],
};
