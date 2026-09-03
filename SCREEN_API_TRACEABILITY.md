# SCREEN-BY-SCREEN TRACEABILITY MATRIX
## Society & Community Event Management System

This document maps all 62 frontend screens to their backend endpoints, required permissions, UI components, forms, validation rules, states, and workflows.

---

| Screen ID | Screen Name | Route | Permission | APIs Used | Form ID | Components |
|---|---|---|---|---|---|---|
| **SCR-001** | Login | `/login` | Public | `POST /auth/login` | FRM-001 | LoginForm, AuthCard, BrandHeader |
| **SCR-002** | System Dashboard | `/dashboard` | `dashboard.read` | `GET /dashboard` | — | KPICardGrid, FinancialWidget, ProgressGauge, QuickActions |
| **SCR-003** | Society Dashboard | `/societies/:id/dashboard` | `dashboard.read` | `GET /dashboard/societies/:id`, `GET /societies/:id` | — | SocietyOverview, UnitBreakdown, CollectionSummary |
| **SCR-004** | Event Dashboard | `/events/:id/dashboard` | `dashboard.read` | `GET /events/:id/dashboard`, `GET /events/:id/collections/dashboard` | — | EventKPIGrid, PaymentMethodPieChart, CollectionStats |
| **SCR-005** | Society Listing | `/societies` | `society.read` | `GET /societies`, `DELETE /societies/:id` | — | DataTable, SearchBar, StatusBadge, ActionDropdown |
| **SCR-006** | Create Society | `/societies/create` | `society.create` | `POST /societies` | FRM-002 | SocietyForm, FormSection, PrimaryButton |
| **SCR-007** | Society Details | `/societies/:id` | `society.read` | `GET /societies/:id`, `GET /societies/:id/structure` | — | DetailsCard, StructureSummary, SubNavigationTabs |
| **SCR-008** | Edit Society | `/societies/:id/edit` | `society.update` | `GET /societies/:id`, `PATCH /societies/:id` | FRM-003 | SocietyForm, FormSection, CancelSaveActions |
| **SCR-009** | Society Structure Config | `/societies/:id/structure` | `society.structure_config` | `GET /societies/:id/structure`, `PUT /societies/:id/structure` | FRM-004 | ToggleSwitch, HierarchyPreview, SaveConfigButton |
| **SCR-010** | Block Listing | `/blocks` | `block.read` | `GET /blocks`, `DELETE /blocks/:id` | — | DataTable, SocietyFilter, StatusBadge |
| **SCR-011** | Create Block | `/blocks/create` | `block.create` | `POST /blocks`, `GET /societies` | FRM-005 | BlockForm, SocietySelect, SubmitButton |
| **SCR-012** | Edit Block | `/blocks/:id/edit` | `block.update` | `GET /blocks/:id`, `PATCH /blocks/:id` | FRM-006 | BlockForm, UpdateButton |
| **SCR-013** | Floor Listing | `/floors` | `floor.read` | `GET /floors`, `DELETE /floors/:id` | — | DataTable, BlockFilter, StatusBadge |
| **SCR-014** | Create Floor | `/floors/create` | `floor.create` | `POST /floors`, `GET /blocks` | FRM-007 | FloorForm, BlockSelect, SubmitButton |
| **SCR-015** | Edit Floor | `/floors/:id/edit` | `floor.update` | `GET /floors/:id`, `PATCH /floors/:id` | FRM-008 | FloorForm, UpdateButton |
| **SCR-016** | Flat Listing | `/flats` | `flat.read` | `GET /flats`, `DELETE /flats/:id` | — | DataTable, FloorFilter, StatusBadge |
| **SCR-017** | Create Flat | `/flats/create` | `flat.create` | `POST /flats`, `GET /floors` | FRM-009 | FlatForm, FloorSelect, SubmitButton |
| **SCR-018** | Flat Details | `/flats/:id` | `flat.read` | `GET /flats/:id`, `GET /flats/:id/residents`, `GET /flats/:id/collections`, `PATCH /flats/:id/primary-owner/:personId` | — | InfoCard, ResidentsSubTable, CollectionsSubTable, SetPrimaryOwnerModal |
| **SCR-019** | Edit Flat | `/flats/:id/edit` | `flat.update` | `GET /flats/:id`, `PATCH /flats/:id` | FRM-010 | FlatForm, UpdateButton |
| **SCR-020** | Bungalow Listing | `/bungalows` | `bungalow.read` | `GET /bungalows`, `DELETE /bungalows/:id` | — | DataTable, SocietyFilter, StatusBadge |
| **SCR-021** | Create Bungalow | `/bungalows/create` | `bungalow.create` | `POST /bungalows`, `GET /societies` | FRM-011 | BungalowForm, SocietySelect, SubmitButton |
| **SCR-022** | Bungalow Details | `/bungalows/:id` | `bungalow.read` | `GET /bungalows/:id`, `GET /bungalows/:id/residents`, `GET /bungalows/:id/collections`, `PATCH /bungalows/:id/primary-owner/:personId` | — | InfoCard, ResidentsSubTable, CollectionsSubTable, SetPrimaryOwnerModal |
| **SCR-023** | Edit Bungalow | `/bungalows/:id/edit` | `bungalow.update` | `GET /bungalows/:id`, `PATCH /bungalows/:id` | FRM-012 | BungalowForm, UpdateButton |
| **SCR-024** | Resident Listing | `/residents` | `person.read` | `GET /persons`, `DELETE /persons/:id` | — | DataTable, UnitFilter, PrimaryOwnerBadge |
| **SCR-025** | Create Resident | `/residents/create` | `person.create` | `POST /persons`, `GET /flats`, `GET /bungalows` | FRM-013 | ResidentForm, DynamicUnitSelector, SubmitButton |
| **SCR-026** | Resident Details | `/residents/:id` | `person.read` | `GET /persons/:id` | — | ResidentProfileCard, UnitLinkCard |
| **SCR-027** | Edit Resident | `/residents/:id/edit` | `person.update` | `GET /persons/:id`, `PATCH /persons/:id` | FRM-014 | ResidentForm, UpdateButton |
| **SCR-028** | Event Listing | `/events` | `event.read` | `GET /events`, `DELETE /events/:id` | — | DataTable, EventCardGrid, StatusFilter, StatusBadge |
| **SCR-029** | Create Event | `/events/create` | `event.create` | `POST /events`, `GET /societies` | FRM-015 | EventForm, ModuleToggles, DatePicker |
| **SCR-030** | Event Details | `/events/:id` | `event.read` | `GET /events/:id`, `POST /events/:id/publish` | — | DynamicTabsShell, OverviewTab, PublishButtonModal |
| **SCR-031** | Edit Event | `/events/:id/edit` | `event.update` | `GET /events/:id`, `PATCH /events/:id` | FRM-016 | EventForm, UpdateButton |
| **SCR-032** | Event Configuration | `/events/:id/configuration` | `event.config` | `GET /events/:id`, `POST /events/:id/configuration` | FRM-017 | ModuleToggleGrid, SaveConfigButton |
| **SCR-033** | Event Dashboard | `/events/:id/dashboard` | `dashboard.read` | `GET /events/:id/dashboard`, `GET /events/:id/collections/dashboard` | — | FinancialOverview, PaymentBreakdownChart |
| **SCR-034** | Event Collections | `/events/:id/collections` | `collection.read` | `GET /events/:id/collections`, `POST /collections`, `PATCH /collections/:id` | FRM-018 | CollectionsTable, CreateObligationModal, StatusBadge |
| **SCR-035** | Event Collections Dashboard | `/events/:id/collections/dashboard` | `dashboard.read` | `GET /events/:id/collections/dashboard` | — | CollectionKPIs, MethodBreakdownChart |
| **SCR-036** | Event Sponsors | `/events/:id/sponsors` | `sponsorship.read` | `GET /events/:id/sponsors`, `POST /events/:id/sponsors`, `PATCH /sponsors/:id`, `DELETE /sponsors/:id` | FRM-023, FRM-024 | SponsorsTable, AddSponsorModal, EditSponsorModal |
| **SCR-037** | Event Food | `/events/:id/food` | `food.read` | `GET /events/:id/food`, `POST /events/:id/food`, `PATCH /food/:id`, `DELETE /food/:id` | FRM-026 | FoodTable, AddFoodModal, EditFoodModal |
| **SCR-038** | Event Dress Codes | `/events/:id/dress-codes` | `dress_code.read` | `GET /events/:id/dress-codes`, `POST /events/:id/dress-codes`, `PATCH /dress-codes/:id`, `DELETE /dress-codes/:id` | FRM-027 | DressCodesTable, AddDressCodeModal |
| **SCR-039** | Event Activities | `/events/:id/activities` | `activity.read` | `GET /events/:id/activities`, `POST /events/:id/activities`, `PATCH /activities/:id`, `DELETE /activities/:id` | FRM-028 | ActivitiesTable, AddActivityModal |
| **SCR-040** | Collections Listing | `/collections` | `collection.read` | `GET /collections`, `PATCH /collections/:id` | — | GlobalCollectionsTable, StatusFilter, CurrencyDisplay |
| **SCR-041** | Collection Details | `/collections/:id` | `collection.read` | `GET /collections/:id`, `PATCH /collections/:id` | FRM-019 | CollectionSummaryCard, PaymentHistoryList, UpdateAmountModal |
| **SCR-042** | Payments Listing | `/payments` | `payment.read` | `GET /payments`, `GET /payment-methods` | — | PaymentsTable, MethodFilter, StatusBadge |
| **SCR-043** | Payment Details | `/payments/:id` | `payment.read` | `GET /payments/:id`, `POST /payments/:id/reverse` | FRM-021 | PaymentReceiptCard, ReversePaymentDialog |
| **SCR-044** | Record Payment | `/payments/record` | `payment.create` | `POST /payments`, `GET /collections`, `GET /payment-methods`, `GET /users` | FRM-020 | PaymentForm, ChequeFieldsSection, SubmitButton |
| **SCR-045** | Payment Methods | `/payment-methods` | `payment_method.read` | `GET /payment-methods`, `POST /payment-methods`, `PATCH /payment-methods/:id`, `DELETE /payment-methods/:id` | FRM-022 | PaymentMethodsTable, CreateEditMethodModal |
| **SCR-046** | Sponsor Details | `/sponsors/:id` | `sponsorship.read` | `GET /sponsors/:id`, `POST /sponsors/:id/payments`, `GET /sponsors/:id/payments` | FRM-025 | SponsorInfoCard, RecordPaymentModal, PaymentHistoryTable |
| **SCR-047** | Reports Hub | `/reports` | `report.read` | `GET /reports/*`, `POST /reports/export` | FRM-029 | ReportTypeSelector, DynamicFiltersCard, ReportPreviewTable, ExportDownloadButton |
| **SCR-048** | Import Listing | `/imports` | `import.read` | `GET /imports` | — | BatchTable, StatusBadge, UploadNewCTA |
| **SCR-049** | Import Upload | `/imports/upload` | `import.upload` | `GET /imports/template`, `POST /imports/excel` | — | FileDropzone, TemplateDownloadCTA, UploadProgressBar |
| **SCR-050** | Import Batch Preview | `/imports/:id/preview` | `import.read` | `GET /imports/:id`, `GET /imports/:id/preview`, `GET /imports/:id/errors`, `GET /imports/:id/error-report`, `POST /imports/:id/commit` | — | BatchSummaryHeader, ValidRowsTab, InvalidRowsTab, CommitModal |
| **SCR-051** | User Listing | `/users` | `user.read` | `GET /users`, `DELETE /users/:id` | — | UsersTable, RoleBadge, ActionDropdown |
| **SCR-052** | Create User | `/users/create` | `user.create` | `POST /users`, `GET /roles`, `GET /societies` | FRM-030 | UserForm, RoleSelect, MultiSocietySelect |
| **SCR-053** | User Details | `/users/:id` | `user.read` | `GET /users/:id` | — | UserProfileCard, AssignedSocietiesList |
| **SCR-054** | Edit User | `/users/:id/edit` | `user.update` | `GET /users/:id`, `PATCH /users/:id`, `GET /roles`, `GET /societies` | FRM-031 | UserForm, UpdateButton |
| **SCR-055** | Role Listing | `/roles` | `role.read` | `GET /roles`, `DELETE /roles/:id` | — | RolesTable, PermissionsCountBadge |
| **SCR-056** | Create Role | `/roles/create` | `role.manage` | `POST /roles`, `GET /permissions` | FRM-032 | RoleForm, PermissionCheckboxGrid |
| **SCR-057** | Role Details / Edit | `/roles/:id` | `role.manage` | `GET /roles/:id`, `PATCH /roles/:id`, `GET /permissions` | FRM-033 | RoleForm, PermissionCheckboxGrid, SavePermissionsCTA |
| **SCR-058** | System Settings | `/settings` | `setting.read` | `GET /settings`, `PATCH /settings/:key` | FRM-034 | SettingsTable, EditValueJsonModal |
| **SCR-059** | Audit Log Listing | `/audit-logs` | `audit.read` | `GET /audit-logs` | — | AuditTable, EntityFilter, RelativeTimeDisplay |
| **SCR-060** | Audit Log Details | `/audit-logs/:id` | `audit.read` | `GET /audit-logs/:id` | — | AuditDetailCard, DiffViewerModal |
| **SCR-061** | 404 Not Found | `*` | Public | None | — | NotFoundCard, BackToDashboardCTA |
| **SCR-062** | Unauthorized | `/unauthorized` | Public | None | — | UnauthorizedCard, RequestAccessHelp |
