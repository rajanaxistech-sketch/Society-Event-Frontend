// Standard API Responses
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
  errors?: string[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
  code?: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  societyId?: string;
  blockId?: string;
  floorId?: string;
  eventId?: string;
  flatId?: string;
  bungalowId?: string;
  userId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  paymentMethodId?: string;
  paymentStatus?: string;
  [key: string]: any;
}

// Auth Types
export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface AssignedSociety {
  id: string;
  name: string;
  code?: string;
  isPrimary?: boolean;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  role: UserRole;
  permissions: string[];
  societies: AssignedSociety[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseData {
  tokens: AuthTokens;
  user: AuthUser;
}

// Permission & Role
export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string | null;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string | null;
  status?: string;
  is_system?: boolean;
  created_at: string;
  permissions?: PermissionItem[];
  role_permissions?: { permission: PermissionItem }[];
  _count?: {
    users?: number;
    role_permissions?: number;
  };
}

// User Entity
export interface UserItem {
  id: string;
  role_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  status: string;
  last_login_at?: string | null;
  created_at: string;
  updated_at?: string;
  role?: UserRole;
  roles?: RoleItem[];
  user_roles?: Array<{
    role_id: string;
    role?: RoleItem;
  }>;
  user_societies?: Array<{
    society_id: string;
    is_primary: boolean;
    society?: SocietyItem;
  }>;
}

// Society & Structure Configuration
export interface SocietyStructureConfig {
  id: string;
  society_id: string;
  flat_enabled: boolean;
  bungalow_enabled: boolean;
  setup_completed: boolean;
  configured_by?: string | null;
  configured_at?: string | null;
}

export interface SocietyItem {
  id: string;
  name: string;
  code?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  structure_configuration?: SocietyStructureConfig;
  _count?: {
    blocks?: number;
    bungalows?: number;
    events?: number;
    floors?: number;
    flats?: number;
    shops?: number;
    persons?: number;
  };
}

export type SocietyStructureType = 'flats' | 'bungalows' | 'hybrid';

export interface SetupWizardBlockConfig {
  name: string;
  code?: string;
  floors_count: number;
  has_commercial_shops?: boolean;
  commercial_shops_count?: number;
  flats_per_floor: number;
  series_start?: number;
  flat_type?: string;
}

export interface SetupWizardBungalowConfig {
  prefix?: string;
  count: number;
  starting_number?: number;
  bungalow_type?: string;
  custom_names?: string[];
}

export interface SetupWizardOwnerMapping {
  unit_identifier: string; // e.g. "Block A-101" or "Villa-1"
  unit_number: string;
  block_name?: string;
  unit_type?: string;
  full_name: string;
  phone?: string;
  email?: string;
  relationship_to_owner?: string;
  is_primary_owner?: boolean;
}

export interface SetupWizardPayload {
  structure_type?: SocietyStructureType;
  society: {
    name: string;
    code?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    status: string;
  };
  blocks?: SetupWizardBlockConfig[];
  bungalows_config?: SetupWizardBungalowConfig;
  enable_bungalows?: boolean;
  bungalows_count?: number;
  mapped_owners?: SetupWizardOwnerMapping[];
}

// Property Structure: Blocks, Floors, Flats, Bungalows
export interface BlockItem {
  id: string;
  society_id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  status: string;
  created_at: string;
  society?: SocietyItem;
  floors?: FloorItem[];
  _count?: {
    floors?: number;
  };
}

export interface FloorItem {
  id: string;
  block_id: string;
  floor_number: number;
  name?: string | null;
  status: string;
  created_at: string;
  block?: BlockItem;
  flats?: FlatItem[];
  _count?: {
    flats?: number;
  };
}

export interface FlatOwnerItem {
  id: string;
  flat_id: string;
  person_id: string;
  is_primary: boolean;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  person?: PersonItem;
}

export interface FlatItem {
  id: string;
  floor_id: string;
  flat_number: string;
  flat_type?: string | null;
  status: string;
  created_at: string;
  floor?: FloorItem;
  persons?: PersonItem[];
  flat_owners?: FlatOwnerItem[];
}

export interface BungalowOwnerItem {
  id: string;
  bungalow_id: string;
  person_id: string;
  is_primary: boolean;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  person?: PersonItem;
}

export interface BungalowItem {
  id: string;
  society_id: string;
  bungalow_number: string;
  bungalow_type?: string | null;
  status: string;
  created_at: string;
  society?: SocietyItem;
  persons?: PersonItem[];
  bungalow_owners?: BungalowOwnerItem[];
}

// Persons (Residents)
export interface PersonItem {
  id: string;
  flat_id?: string | null;
  bungalow_id?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  relationship_to_owner?: string | null;
  is_primary_owner: boolean;
  status: string;
  created_at: string;
  flat?: FlatItem & {
    floor?: FloorItem & {
      block?: BlockItem & {
        society?: SocietyItem;
      };
    };
  };
  bungalow?: BungalowItem & {
    society?: SocietyItem;
  };
}

// Events & Configuration
export interface EventConfigurationItem {
  id: string;
  event_id: string;
  collection_enabled: boolean;
  food_enabled: boolean;
  dress_code_enabled: boolean;
  dhol_enabled: boolean;
  band_enabled: boolean;
  sponsorship_enabled: boolean;
  activities_enabled: boolean;
  other_config?: Record<string, any> | null;
}

export interface EventItem {
  id: string;
  society_id: string;
  name: string;
  event_year?: number | null;
  is_navratri?: boolean;
  default_collection_amount?: number | string | null;
  instructions?: string | null;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  banner_url?: string | null;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled' | string;
  published_at?: string | null;
  created_at: string;
  updated_at?: string;
  society?: SocietyItem;
  event_configuration?: EventConfigurationItem;
  _count?: {
    event_collections?: number;
    event_items?: number;
    vendor_contracts?: number;
    sponsors?: number;
    food_items?: number;
    dress_codes?: number;
    event_activities?: number;
    circulars?: number;
  };
}

// Event Items / Services (Expenses)
export type PricingType = 'fixed' | 'day_wise' | 'recurring_daily' | 'quantity_based';

export interface EventServiceItem {
  id: string;
  event_id: string;
  vendor_contract_id?: string | null;
  name: string;
  category: string;
  description?: string | null;
  vendor_name?: string | null;
  pricing_type: PricingType;
  quantity?: number | string | null;
  unit?: string | null;
  base_price?: number | string | null;
  price_per_day?: number | string | null;
  number_of_days?: number | null;
  applicable_days?: string[] | number[] | null;
  day_wise_prices?: Record<string, number> | null;
  total_price: number | string;
  start_date?: string | null;
  end_date?: string | null;
  is_default_navratri?: boolean;
  notes?: string | null;
  status: 'active' | 'inactive' | 'cancelled' | string;
  created_at: string;
  updated_at?: string;
  vendor_contract?: {
    id: string;
    vendor_name: string;
    contract_type: string;
    contract_amount: number | string;
    remaining_balance: number | string;
  } | null;
}

// Event Vendors / Contractors & Vendor Payments
export interface VendorPaymentItem {
  id: string;
  contract_id: string;
  event_id: string;
  amount: number | string;
  payment_date: string;
  payment_method: 'CASH' | 'CHEQUE' | 'ONLINE' | 'BANK_TRANSFER' | string;
  reference_number?: string | null;
  cheque_number?: string | null;
  bank_name?: string | null;
  cheque_date?: string | null;
  remarks?: string | null;
  attachment_url?: string | null;
  recorded_by?: string | null;
  status: string;
  created_at: string;
}

export interface EventContractItem {
  id: string;
  event_id: string;
  contract_type: string;
  vendor_name: string;
  contact_person?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  contract_amount: number | string;
  advance_payment: number | string;
  total_paid: number | string;
  remaining_balance: number | string;
  notes?: string | null;
  status: 'active' | 'completed' | 'cancelled' | string;
  created_at: string;
  updated_at?: string;
  payments?: VendorPaymentItem[];
  event_items?: EventServiceItem[];
  _count?: {
    payments?: number;
    event_items?: number;
  };
}

export interface EventFinancialSummary {
  totalEstimatedCost: number;
  totalVendorContracts: number;
  totalVendorPaid: number;
  totalVendorPending: number;
  expectedCollection: number;
  totalCollectionReceived: number;
  collectionPending: number;
}

export interface EventDashboardData {
  event?: EventItem;
  summary?: {
    total_budget: number;
    total_actual_spent: number;
    balance_budget: number;
    total_revenue: number;
    total_sponsors: number;
    total_collections: number;
    collection_progress_percent: number;
  };
  collections?: {
    total_expected: number;
    total_collected: number;
    pending_amount: number;
    paid_count: number;
    pending_count: number;
    total_flats: number;
  };
  items?: {
    total_count: number;
    total_estimated_cost: number;
  };
  vendors?: {
    total_contracts: number;
    total_agreed_amount: number;
    total_paid: number;
    total_pending_balance: number;
  };
}

// Circulars
export interface CircularItem {
  id: string;
  society_id: string;
  event_id?: string | null;
  title: string;
  description: string;
  file_name?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  status: 'draft' | 'published' | 'unpublished' | string;
  created_by?: string | null;
  updated_by?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  society?: SocietyItem;
  event?: EventItem;
  creator?: {
    id: string;
    full_name: string;
    email: string;
  };
  updater?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Payment Methods & Payments
export interface PaymentMethodItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  requires_reference?: boolean;
  requires_verification?: boolean;
  is_active?: boolean;
  status?: string;
}

export interface PaymentItem {
  id: string;
  collection_id?: string | null;
  event_collection_id?: string | null;
  sponsor_id?: string | null;
  payment_method_id: string;
  amount: number | string;
  amount_paid?: number | string;
  payment_date: string;
  transaction_reference?: string | null;
  receipt_number?: string | null;
  collector_user_id?: string | null;
  recorded_by?: string | null;
  cheque_number?: string | null;
  bank_name?: string | null;
  cheque_date?: string | null;
  clearing_status?: 'pending' | 'cleared' | 'bounced' | 'cancelled' | string | null;
  notes?: string | null;
  status?: 'recorded' | 'reversed' | 'completed' | 'pending' | 'failed' | string;
  payment_status?: 'recorded' | 'reversed' | 'completed' | 'pending' | 'failed' | string;
  reversal_reason?: string | null;
  created_at: string;
  payment_method?: PaymentMethodItem;
  collector?: UserItem;
  recorded_by_user?: UserItem;
  collection?: EventCollectionItem;
  event_collection?: EventCollectionItem;
  sponsor?: SponsorItem;
}

// Collections
export interface EventCollectionItem {
  id: string;
  event_id: string;
  flat_id?: string | null;
  bungalow_id?: string | null;
  default_amount: number | string;
  custom_amount?: number | string | null;
  expected_amount: number | string;
  amount_paid: number | string;
  pending_amount: number | string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue' | string;
  last_payment_date?: string | null;
  receipt_reference?: string | null;
  created_at: string;
  event?: EventItem;
  flat?: FlatItem & {
    floor?: FloorItem & {
      block?: BlockItem;
    };
    persons?: PersonItem[];
  };
  bungalow?: BungalowItem & {
    persons?: PersonItem[];
  };
  payments?: PaymentItem[];
}

// Sponsors & Sponsorship Payments
export interface SponsorshipPaymentItem {
  id: string;
  sponsor_id: string;
  payment_method_id?: string | null;
  amount: number | string;
  payment_date: string;
  transaction_reference?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  payment_method?: PaymentMethodItem;
}

export interface SponsorItem {
  id: string;
  event_id: string;
  company_name: string;
  contact_person?: string | null;
  contact_number?: string | null;
  email?: string | null;
  sponsorship_amount: number | string;
  sponsorship_type?: string | null;
  payment_method_id?: string | null;
  payment_status: 'pending' | 'partially_paid' | 'paid' | string;
  sponsorship_date?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
  event?: EventItem;
  payment_method?: PaymentMethodItem;
  sponsorship_payments?: SponsorshipPaymentItem[];
}

// Event Sub-modules: Food, Dress Code, Activities
export interface FoodItemEntity {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  quantity?: number | string | null;
  quantity_unit?: string | null;
  estimated_cost?: number | string | null;
  vendor_name?: string | null;
  food_datetime?: string | null;
  availability_status?: string | null;
  notes?: string | null;
  created_at: string;
  event?: EventItem;
}

export interface DressCodeItem {
  id: string;
  event_id: string;
  category: string;
  description: string;
  instructions?: string | null;
  status: string;
  created_at: string;
  event?: EventItem;
}

export interface EventActivityItem {
  id: string;
  event_id: string;
  activity_name: string;
  description?: string | null;
  activity_datetime?: string | null;
  vendor_performer?: string | null;
  cost?: number | string | null;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled' | string;
  notes?: string | null;
  created_at: string;
  event?: EventItem;
}

// Imports (ETL)
export interface ImportJobItem {
  id: string;
  file_name: string;
  file_type?: string;
  entity_type?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  created_at?: string;
  status: 'pending' | 'validating' | 'validated' | 'completed' | 'partial' | 'failed' | string;
  total_rows?: number;
  valid_rows?: number;
  success_rows?: number;
  invalid_rows?: number;
  inserted_rows?: number;
  updated_rows?: number;
  failed_rows?: number;
  raw_data?: any;
  error_details?: any;
  error_report_url?: string | null;
  completed_at?: string | null;
  uploader?: UserItem;
}

export type ImportBatchItem = ImportJobItem;

export interface ImportRowItem {
  id: string;
  batch_id: string;
  row_number: number;
  raw_data: Record<string, any>;
  normalized_data?: Record<string, any> | null;
  validation_status: 'valid' | 'invalid' | 'pending' | string;
  duplicate_status: string;
  error_messages?: string[] | null;
  target_entity?: string | null;
  target_record_id?: string | null;
  processed_at?: string | null;
}

export interface ImportErrorItem {
  id: string;
  batch_id: string;
  row_id?: string | null;
  row_number: number;
  field_name?: string | null;
  error_code: string;
  error_message: string;
  severity: string;
}

// System Settings
export interface SystemSettingItem {
  id: string;
  key: string;
  value?: any;
  value_json?: any;
  description?: string | null;
  status?: string;
  updated_by?: string | null;
  updated_at: string;
  updater?: UserItem;
}

// Audit Logs
export interface AuditLogItem {
  id: string;
  user_id?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: UserItem;
}

// Dashboards
export interface SystemDashboardOverview {
  totalSocieties: number;
  totalBlocks: number;
  totalFlats: number;
  totalBungalows: number;
  totalResidentialUnits: number;
  totalResidents: number;
  totalEvents: number;
  activeEvents: number;
}

export interface SystemDashboardFinancials {
  totalExpectedCollection: number;
  totalCollectionPaid: number;
  totalCollectionPending: number;
  flatCollectionPaid: number;
  flatCollectionPending: number;
  bungalowCollectionPaid: number;
  bungalowCollectionPending: number;
  collectionPercentage: number;
  totalSponsorshipCollected: number;
}

export interface SystemDashboardData {
  overview: SystemDashboardOverview;
  financials: SystemDashboardFinancials;
}

export interface EventCollectionsDashboardData {
  eventId: string;
  totalFlats: number;
  totalExpectedCollection: number;
  totalCollected: number;
  totalPending: number;
  partiallyPaidAmount: number;
  collectionPercentage: number;
  paidFlats: number;
  pendingFlats: number;
  breakdownByMethod: {
    qr: number;
    cash: number;
    cheque: number;
    [key: string]: number;
  };
}

export interface ReportExportRequest {
  report_type: string;
  format: 'xlsx' | 'csv' | 'pdf';
  filters?: Record<string, any>;
}

export interface ReportExportResponse {
  export_id?: string;
  file_url: string;
  file_name?: string;
  format?: string;
  total_records?: number;
}
