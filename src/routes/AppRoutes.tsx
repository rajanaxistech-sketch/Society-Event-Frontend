import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppRoutes as Paths } from '../constants/routes';
import { Permissions } from '../constants/permissions';
import ProtectedRoute from './ProtectedRoute';
import PermissionRoute from './PermissionRoute';

// Layouts
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';

// Auth & Errors
import LoginPage from '../pages/auth/LoginPage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';

// Dashboards
import SystemDashboardPage from '../pages/dashboard/SystemDashboardPage';
import SocietyDashboardPage from '../pages/dashboard/SocietyDashboardPage';
import EventDashboardPage from '../pages/dashboard/EventDashboardPage';
import EventCollectionsDashboardPage from '../pages/dashboard/EventCollectionsDashboardPage';

// Societies
import SocietyListPage from '../pages/societies/SocietyListPage';
import CreateSocietyPage from '../pages/societies/CreateSocietyPage';
import SocietyDetailsPage from '../pages/societies/SocietyDetailsPage';
import EditSocietyPage from '../pages/societies/EditSocietyPage';
import SocietyStructurePage from '../pages/societies/SocietyStructurePage';

// Blocks
import BlockListPage from '../pages/blocks/BlockListPage';
import CreateBlockPage from '../pages/blocks/CreateBlockPage';
import EditBlockPage from '../pages/blocks/EditBlockPage';

// Floors
import FloorListPage from '../pages/floors/FloorListPage';
import CreateFloorPage from '../pages/floors/CreateFloorPage';
import EditFloorPage from '../pages/floors/EditFloorPage';

// Flats
import FlatListPage from '../pages/flats/FlatListPage';
import CreateFlatPage from '../pages/flats/CreateFlatPage';
import FlatDetailsPage from '../pages/flats/FlatDetailsPage';
import EditFlatPage from '../pages/flats/EditFlatPage';

// Bungalows
import BungalowListPage from '../pages/bungalows/BungalowListPage';
import CreateBungalowPage from '../pages/bungalows/CreateBungalowPage';
import BungalowDetailsPage from '../pages/bungalows/BungalowDetailsPage';
import EditBungalowPage from '../pages/bungalows/EditBungalowPage';

// Residents
import ResidentListPage from '../pages/residents/ResidentListPage';
import CreateResidentPage from '../pages/residents/CreateResidentPage';
import ResidentDetailsPage from '../pages/residents/ResidentDetailsPage';
import EditResidentPage from '../pages/residents/EditResidentPage';

// Events
import EventListPage from '../pages/events/EventListPage';
import CreateEventPage from '../pages/events/CreateEventPage';
import EventDetailsPage from '../pages/events/EventDetailsPage';
import EditEventPage from '../pages/events/EditEventPage';
import EventConfigurationPage from '../pages/events/EventConfigurationPage';
import EventCollectionsPage from '../pages/events/EventCollectionsPage';
import EventSponsorsPage from '../pages/events/EventSponsorsPage';
import EventFoodPage from '../pages/events/EventFoodPage';
import EventDressCodesPage from '../pages/events/EventDressCodesPage';
import EventActivitiesPage from '../pages/events/EventActivitiesPage';

// Collections & Payments
import CollectionListPage from '../pages/collections/CollectionListPage';
import CollectionDetailsPage from '../pages/collections/CollectionDetailsPage';
import PaymentListPage from '../pages/payments/PaymentListPage';
import PaymentDetailsPage from '../pages/payments/PaymentDetailsPage';
import RecordPaymentPage from '../pages/payments/RecordPaymentPage';
import PaymentMethodsPage from '../pages/payments/PaymentMethodsPage';
import SponsorDetailsPage from '../pages/sponsorships/SponsorDetailsPage';

// Reports & Imports
import ReportsHubPage from '../pages/reports/ReportsHubPage';
import ImportListPage from '../pages/imports/ImportListPage';
import ImportUploadPage from '../pages/imports/ImportUploadPage';
import ImportPreviewPage from '../pages/imports/ImportPreviewPage';

// Users, Roles, Settings, Audit
import UserListPage from '../pages/users/UserListPage';
import CreateUserPage from '../pages/users/CreateUserPage';
import UserDetailsPage from '../pages/users/UserDetailsPage';
import EditUserPage from '../pages/users/EditUserPage';
import RoleListPage from '../pages/roles/RoleListPage';
import CreateRolePage from '../pages/roles/CreateRolePage';
import RoleDetailsPage from '../pages/roles/RoleDetailsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import AuditLogListPage from '../pages/audit-logs/AuditLogListPage';
import AuditLogDetailsPage from '../pages/audit-logs/AuditLogDetailsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path={Paths.LOGIN} element={<LoginPage />} />
      </Route>

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to={Paths.DASHBOARD_SYSTEM} replace />} />

          {/* Dashboards */}
          <Route
            path={Paths.DASHBOARD_SYSTEM}
            element={
              <PermissionRoute permission={Permissions.DASHBOARD_SYSTEM}>
                <SystemDashboardPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.DASHBOARD_SOCIETY}
            element={
              <PermissionRoute permission={Permissions.DASHBOARD_SOCIETY}>
                <SocietyDashboardPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.DASHBOARD_EVENT}
            element={
              <PermissionRoute permission={Permissions.DASHBOARD_EVENT}>
                <EventDashboardPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.DASHBOARD_EVENT_COLLECTIONS}
            element={
              <PermissionRoute permission={Permissions.DASHBOARD_COLLECTION}>
                <EventCollectionsDashboardPage />
              </PermissionRoute>
            }
          />

          {/* Societies Module */}
          <Route
            path={Paths.SOCIETIES}
            element={
              <PermissionRoute permission={Permissions.SOCIETY_READ}>
                <SocietyListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.SOCIETY_CREATE}
            element={
              <PermissionRoute permission={Permissions.SOCIETY_CREATE}>
                <CreateSocietyPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.SOCIETY_DETAILS}
            element={
              <PermissionRoute permission={Permissions.SOCIETY_READ}>
                <SocietyDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.SOCIETY_EDIT}
            element={
              <PermissionRoute permission={Permissions.SOCIETY_UPDATE}>
                <EditSocietyPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.SOCIETY_STRUCTURE}
            element={
              <PermissionRoute permission={Permissions.SOCIETY_STRUCTURE_CONFIG}>
                <SocietyStructurePage />
              </PermissionRoute>
            }
          />

          {/* Blocks Module */}
          <Route
            path={Paths.BLOCKS}
            element={
              <PermissionRoute permission={Permissions.BLOCK_READ}>
                <BlockListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.BLOCK_CREATE}
            element={
              <PermissionRoute permission={Permissions.BLOCK_CREATE}>
                <CreateBlockPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.BLOCK_EDIT}
            element={
              <PermissionRoute permission={Permissions.BLOCK_UPDATE}>
                <EditBlockPage />
              </PermissionRoute>
            }
          />

          {/* Floors Module */}
          <Route
            path={Paths.FLOORS}
            element={
              <PermissionRoute permission={Permissions.FLOOR_READ}>
                <FloorListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.FLOOR_CREATE}
            element={
              <PermissionRoute permission={Permissions.FLOOR_CREATE}>
                <CreateFloorPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.FLOOR_EDIT}
            element={
              <PermissionRoute permission={Permissions.FLOOR_UPDATE}>
                <EditFloorPage />
              </PermissionRoute>
            }
          />

          {/* Flats Module */}
          <Route
            path={Paths.FLATS}
            element={
              <PermissionRoute permission={Permissions.FLAT_READ}>
                <FlatListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.FLAT_CREATE}
            element={
              <PermissionRoute permission={Permissions.FLAT_CREATE}>
                <CreateFlatPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.FLAT_DETAILS}
            element={
              <PermissionRoute permission={Permissions.FLAT_READ}>
                <FlatDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.FLAT_EDIT}
            element={
              <PermissionRoute permission={Permissions.FLAT_UPDATE}>
                <EditFlatPage />
              </PermissionRoute>
            }
          />

          {/* Bungalows Module */}
          <Route
            path={Paths.BUNGALOWS}
            element={
              <PermissionRoute permission={Permissions.BUNGALOW_READ}>
                <BungalowListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.BUNGALOW_CREATE}
            element={
              <PermissionRoute permission={Permissions.BUNGALOW_CREATE}>
                <CreateBungalowPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.BUNGALOW_DETAILS}
            element={
              <PermissionRoute permission={Permissions.BUNGALOW_READ}>
                <BungalowDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.BUNGALOW_EDIT}
            element={
              <PermissionRoute permission={Permissions.BUNGALOW_UPDATE}>
                <EditBungalowPage />
              </PermissionRoute>
            }
          />

          {/* Residents (Persons) Module */}
          <Route
            path={Paths.RESIDENTS}
            element={
              <PermissionRoute permission={Permissions.PERSON_READ}>
                <ResidentListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.RESIDENT_CREATE}
            element={
              <PermissionRoute permission={Permissions.PERSON_CREATE}>
                <CreateResidentPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.RESIDENT_DETAILS}
            element={
              <PermissionRoute permission={Permissions.PERSON_READ}>
                <ResidentDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.RESIDENT_EDIT}
            element={
              <PermissionRoute permission={Permissions.PERSON_UPDATE}>
                <EditResidentPage />
              </PermissionRoute>
            }
          />

          {/* Events Module & Sub-modules */}
          <Route
            path={Paths.EVENTS}
            element={
              <PermissionRoute permission={Permissions.EVENT_READ}>
                <EventListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.EVENT_CREATE}
            element={
              <PermissionRoute permission={Permissions.EVENT_CREATE}>
                <CreateEventPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.EVENT_DETAILS}
            element={
              <PermissionRoute permission={Permissions.EVENT_READ}>
                <EventDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.EVENT_EDIT}
            element={
              <PermissionRoute permission={Permissions.EVENT_UPDATE}>
                <EditEventPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.EVENT_CONFIGURATION}
            element={
              <PermissionRoute permission={Permissions.EVENT_CONFIG}>
                <EventConfigurationPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.EVENT_COLLECTIONS}
            element={
              <PermissionRoute permission={Permissions.COLLECTION_READ}>
                <EventCollectionsPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.EVENT_SPONSORS}
            element={
              <PermissionRoute permission={Permissions.SPONSORSHIP_READ}>
                <EventSponsorsPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.EVENT_FOOD}
            element={
              <PermissionRoute permission={Permissions.FOOD_READ}>
                <EventFoodPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.EVENT_DRESS_CODES}
            element={
              <PermissionRoute permission={Permissions.DRESS_CODE_READ}>
                <EventDressCodesPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.EVENT_ACTIVITIES}
            element={
              <PermissionRoute permission={Permissions.ACTIVITY_READ}>
                <EventActivitiesPage />
              </PermissionRoute>
            }
          />

          {/* Collections Master */}
          <Route
            path={Paths.COLLECTIONS}
            element={
              <PermissionRoute permission={Permissions.COLLECTION_READ}>
                <CollectionListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.COLLECTION_DETAILS}
            element={
              <PermissionRoute permission={Permissions.COLLECTION_READ}>
                <CollectionDetailsPage />
              </PermissionRoute>
            }
          />

          {/* Payments & Methods */}
          <Route
            path={Paths.PAYMENTS}
            element={
              <PermissionRoute permission={Permissions.PAYMENT_READ}>
                <PaymentListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.PAYMENT_RECORD}
            element={
              <PermissionRoute permission={Permissions.PAYMENT_CREATE}>
                <RecordPaymentPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.PAYMENT_DETAILS}
            element={
              <PermissionRoute permission={Permissions.PAYMENT_READ}>
                <PaymentDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.PAYMENT_METHODS}
            element={
              <PermissionRoute permission={Permissions.PAYMENT_METHOD_READ}>
                <PaymentMethodsPage />
              </PermissionRoute>
            }
          />

          {/* Sponsorships */}
          <Route
            path={Paths.SPONSOR_DETAILS}
            element={
              <PermissionRoute permission={Permissions.SPONSORSHIP_READ}>
                <SponsorDetailsPage />
              </PermissionRoute>
            }
          />

          {/* Reports Hub */}
          <Route
            path={Paths.REPORTS_HUB}
            element={
              <PermissionRoute permission={Permissions.REPORT_READ}>
                <ReportsHubPage />
              </PermissionRoute>
            }
          />

          {/* Bulk Imports */}
          <Route
            path={Paths.IMPORTS}
            element={
              <PermissionRoute permission={Permissions.IMPORT_READ}>
                <ImportListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.IMPORT_UPLOAD}
            element={
              <PermissionRoute permission={Permissions.IMPORT_UPLOAD}>
                <ImportUploadPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.IMPORT_PREVIEW}
            element={
              <PermissionRoute permission={Permissions.IMPORT_READ}>
                <ImportPreviewPage />
              </PermissionRoute>
            }
          />

          {/* Users Administration */}
          <Route
            path={Paths.USERS}
            element={
              <PermissionRoute permission={Permissions.USER_READ}>
                <UserListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.USER_CREATE}
            element={
              <PermissionRoute permission={Permissions.USER_CREATE}>
                <CreateUserPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.USER_DETAILS}
            element={
              <PermissionRoute permission={Permissions.USER_READ}>
                <UserDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.USER_EDIT}
            element={
              <PermissionRoute permission={Permissions.USER_UPDATE}>
                <EditUserPage />
              </PermissionRoute>
            }
          />

          {/* Roles & RBAC Matrix */}
          <Route
            path={Paths.ROLES}
            element={
              <PermissionRoute permission={Permissions.ROLE_READ}>
                <RoleListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.ROLE_CREATE}
            element={
              <PermissionRoute permission={Permissions.ROLE_CREATE}>
                <CreateRolePage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.ROLE_DETAILS}
            element={
              <PermissionRoute permission={Permissions.ROLE_READ}>
                <RoleDetailsPage />
              </PermissionRoute>
            }
          />

          {/* Settings */}
          <Route
            path={Paths.SETTINGS}
            element={
              <PermissionRoute permission={Permissions.SETTING_READ}>
                <SettingsPage />
              </PermissionRoute>
            }
          />

          {/* Audit Logs */}
          <Route
            path={Paths.AUDIT_LOGS}
            element={
              <PermissionRoute permission={Permissions.AUDIT_LOG_READ}>
                <AuditLogListPage />
              </PermissionRoute>
            }
          />
          <Route
            path={Paths.AUDIT_LOG_DETAILS}
            element={
              <PermissionRoute permission={Permissions.AUDIT_LOG_READ}>
                <AuditLogDetailsPage />
              </PermissionRoute>
            }
          />

          {/* Error Pages */}
          <Route path={Paths.UNAUTHORIZED} element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
