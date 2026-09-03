export const Permissions = {
  // Societies
  SOCIETY_READ: 'society.read',
  SOCIETY_CREATE: 'society.create',
  SOCIETY_UPDATE: 'society.update',
  SOCIETY_DELETE: 'society.delete',
  SOCIETY_STRUCTURE_CONFIG: 'society.structure_config',

  // Blocks
  BLOCK_READ: 'block.read',
  BLOCK_CREATE: 'block.create',
  BLOCK_UPDATE: 'block.update',
  BLOCK_DELETE: 'block.delete',

  // Floors
  FLOOR_READ: 'floor.read',
  FLOOR_CREATE: 'floor.create',
  FLOOR_UPDATE: 'floor.update',
  FLOOR_DELETE: 'floor.delete',

  // Flats
  FLAT_READ: 'flat.read',
  FLAT_CREATE: 'flat.create',
  FLAT_UPDATE: 'flat.update',
  FLAT_DELETE: 'flat.delete',
  PRIMARY_OWNER_ASSIGN: 'primary_owner.assign',

  // Bungalows
  BUNGALOW_READ: 'bungalow.read',
  BUNGALOW_CREATE: 'bungalow.create',
  BUNGALOW_UPDATE: 'bungalow.update',
  BUNGALOW_DELETE: 'bungalow.delete',
  BUNGALOW_PRIMARY_OWNER_ASSIGN: 'bungalow_primary_owner.assign',

  // Residents (Persons)
  PERSON_READ: 'person.read',
  PERSON_CREATE: 'person.create',
  PERSON_UPDATE: 'person.update',
  PERSON_DELETE: 'person.delete',

  // Events
  EVENT_READ: 'event.read',
  EVENT_CREATE: 'event.create',
  EVENT_UPDATE: 'event.update',
  EVENT_DELETE: 'event.delete',
  EVENT_PUBLISH: 'event.publish',
  EVENT_CONFIG: 'event.config',

  // Collections
  COLLECTION_READ: 'collection.read',
  COLLECTION_CREATE: 'collection.create',
  COLLECTION_UPDATE: 'collection.update',

  // Payments
  PAYMENT_READ: 'payment.read',
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_REVERSE: 'payment.reverse',

  // Payment Methods
  PAYMENT_METHOD_READ: 'payment_method.read',
  PAYMENT_METHOD_MANAGE: 'payment_method.manage',

  // Sponsorships
  SPONSORSHIP_READ: 'sponsorship.read',
  SPONSORSHIP_CREATE: 'sponsorship.create',
  SPONSORSHIP_UPDATE: 'sponsorship.update',
  SPONSORSHIP_DELETE: 'sponsorship.delete',
  SPONSORSHIP_PAYMENT_CREATE: 'sponsorship_payment.create',

  // Food Items
  FOOD_READ: 'food.read',
  FOOD_MANAGE: 'food.manage',

  // Dress Codes
  DRESS_CODE_READ: 'dress_code.read',
  DRESS_CODE_MANAGE: 'dress_code.manage',

  // Activities
  ACTIVITY_READ: 'activity.read',
  ACTIVITY_MANAGE: 'activity.manage',

  // ETL Imports
  IMPORT_UPLOAD: 'import.upload',
  IMPORT_VALIDATE: 'import.validate',
  IMPORT_COMMIT: 'import.commit',
  IMPORT_READ: 'import.read',

  // Reports
  REPORT_READ: 'report.read',
  REPORT_EXPORT: 'report.export',

  // Dashboards
  DASHBOARD_READ: 'dashboard.read',
  DASHBOARD_SYSTEM: 'dashboard.read',
  DASHBOARD_SOCIETY: 'dashboard.read',
  DASHBOARD_EVENT: 'dashboard.read',
  DASHBOARD_COLLECTION: 'dashboard.read',

  // Users
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  // Roles
  ROLE_READ: 'role.read',
  ROLE_MANAGE: 'role.manage',
  ROLE_CREATE: 'role.manage',
  ROLE_UPDATE: 'role.manage',
  ROLE_DELETE: 'role.manage',

  // System Settings
  SETTING_READ: 'setting.read',
  SETTING_UPDATE: 'setting.update',

  // Audit Logs
  AUDIT_READ: 'audit.read',
  AUDIT_LOG_READ: 'audit.read',
} as const;

export type PermissionCode = typeof Permissions[keyof typeof Permissions];
