export const AppRoutes = {
  // Public
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',

  // Dashboards
  DASHBOARD: '/dashboard',
  DASHBOARD_SYSTEM: '/dashboard',
  DASHBOARD_SOCIETY: '/societies/:id/dashboard',
  DASHBOARD_EVENT: '/events/:id/dashboard',
  DASHBOARD_EVENT_COLLECTIONS: '/events/:id/collections/dashboard',
  SOCIETY_DASHBOARD: '/societies/:id/dashboard',
  EVENT_DASHBOARD: '/events/:id/dashboard',

  // Societies
  SOCIETIES: '/societies',
  SOCIETY_CREATE: '/societies/create',
  SOCIETY_SETUP_WIZARD: '/societies/setup-wizard',
  SOCIETY_DETAILS: '/societies/:id',
  SOCIETY_EDIT: '/societies/:id/edit',
  SOCIETY_STRUCTURE: '/societies/:id/structure',

  // Blocks
  BLOCKS: '/blocks',
  BLOCK_CREATE: '/blocks/create',
  BLOCK_EDIT: '/blocks/:id/edit',

  // Floors
  FLOORS: '/floors',
  FLOOR_CREATE: '/floors/create',
  FLOOR_EDIT: '/floors/:id/edit',

  // Flats
  FLATS: '/flats',
  FLAT_CREATE: '/flats/create',
  FLAT_DETAILS: '/flats/:id',
  FLAT_EDIT: '/flats/:id/edit',

  // Bungalows
  BUNGALOWS: '/bungalows',
  BUNGALOW_CREATE: '/bungalows/create',
  BUNGALOW_DETAILS: '/bungalows/:id',
  BUNGALOW_EDIT: '/bungalows/:id/edit',

  // Residents (Persons)
  RESIDENTS: '/residents',
  RESIDENT_CREATE: '/residents/create',
  RESIDENT_DETAILS: '/residents/:id',
  RESIDENT_EDIT: '/residents/:id/edit',

  // Events
  EVENTS: '/events',
  EVENT_CREATE: '/events/create',
  EVENT_DETAILS: '/events/:id',
  EVENT_EDIT: '/events/:id/edit',
  EVENT_CONFIG: '/events/:id/configuration',
  EVENT_CONFIGURATION: '/events/:id/configuration',
  EVENT_COLLECTIONS: '/events/:id/collections',
  EVENT_COLLECTIONS_DASHBOARD: '/events/:id/collections/dashboard',
  EVENT_SPONSORS: '/events/:id/sponsors',
  EVENT_FOOD: '/events/:id/food',
  EVENT_DRESS_CODES: '/events/:id/dress-codes',
  EVENT_ACTIVITIES: '/events/:id/activities',
  EVENT_CIRCULARS: '/events/:id/circulars',

  // Circulars
  CIRCULARS: '/circulars',
  CIRCULAR_CREATE: '/circulars/create',
  CIRCULAR_DETAILS: '/circulars/:id',
  CIRCULAR_EDIT: '/circulars/:id/edit',

  // Payment Methods
  PAYMENT_METHODS: '/payment-methods',

  // Sponsorships
  SPONSOR_DETAILS: '/sponsors/:id',

  // Reports
  REPORTS: '/reports',
  REPORTS_HUB: '/reports',

  // Imports
  IMPORTS: '/imports',
  IMPORT_UPLOAD: '/imports/upload',
  IMPORT_PREVIEW: '/imports/:id/preview',

  // Administration
  USERS: '/users',
  USER_CREATE: '/users/create',
  USER_DETAILS: '/users/:id',
  USER_EDIT: '/users/:id/edit',
  ROLES: '/roles',
  ROLE_CREATE: '/roles/create',
  ROLE_DETAILS: '/roles/:id',
  SETTINGS: '/settings',
  AUDIT_LOGS: '/audit-logs',
  AUDIT_LOG_DETAILS: '/audit-logs/:id',
} as const;
