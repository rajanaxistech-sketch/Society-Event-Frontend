import axiosClient from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  ContractItemModel,
  ContractLineItem,
  ContractItemSchedule,
  ContractDocumentItem,
  ContractPaymentItem,
  CreateContractInput,
  UpdateContractInput,
  RecordContractPaymentInput,
  ContractDashboardStats,
} from '../types';

export interface ContractQueryParams extends QueryParams {
  society_id?: string;
  societyId?: string;
  event_id?: string;
  eventId?: string;
  vendor_id?: string;
  vendorId?: string;
  status?: string;
  payment_status?: string;
  expense_category_id?: string;
  service_group_id?: string;
  start_date?: string;
  end_date?: string;
}

export const contractsService = {
  // List contracts with filters and pagination
  list: async (params?: ContractQueryParams): Promise<PaginatedResponse<ContractItemModel>> => {
    const response = await axiosClient.get<PaginatedResponse<ContractItemModel>>('/contracts', {
      params,
    });
    return response.data;
  },

  // Get single contract by ID with full details
  getById: async (id: string): Promise<ApiResponse<ContractItemModel>> => {
    const response = await axiosClient.get<ApiResponse<ContractItemModel>>(`/contracts/${id}`);
    return response.data;
  },

  // Create contract
  create: async (payload: CreateContractInput): Promise<ApiResponse<ContractItemModel>> => {
    const response = await axiosClient.post<ApiResponse<ContractItemModel>>('/contracts', payload);
    return response.data;
  },

  // Update contract
  update: async (id: string, payload: UpdateContractInput): Promise<ApiResponse<ContractItemModel>> => {
    const response = await axiosClient.put<ApiResponse<ContractItemModel>>(`/contracts/${id}`, payload);
    return response.data;
  },

  // Delete contract
  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/contracts/${id}`);
    return response.data;
  },

  // Lifecycle Transitions
  submitForApproval: async (id: string): Promise<ApiResponse<ContractItemModel>> => {
    const response = await axiosClient.post<ApiResponse<ContractItemModel>>(`/contracts/${id}/submit`);
    return response.data;
  },

  approve: async (id: string, comments?: string): Promise<ApiResponse<ContractItemModel>> => {
    const response = await axiosClient.post<ApiResponse<ContractItemModel>>(`/contracts/${id}/approve`, {
      comments,
    });
    return response.data;
  },

  activate: async (id: string): Promise<ApiResponse<ContractItemModel>> => {
    const response = await axiosClient.post<ApiResponse<ContractItemModel>>(`/contracts/${id}/activate`);
    return response.data;
  },

  complete: async (id: string): Promise<ApiResponse<ContractItemModel>> => {
    const response = await axiosClient.post<ApiResponse<ContractItemModel>>(`/contracts/${id}/complete`);
    return response.data;
  },

  cancel: async (id: string, cancellation_reason?: string): Promise<ApiResponse<ContractItemModel>> => {
    const response = await axiosClient.post<ApiResponse<ContractItemModel>>(`/contracts/${id}/cancel`, {
      cancellation_reason,
    });
    return response.data;
  },

  // Line Items
  addItem: async (
    contractId: string,
    payload: Omit<ContractLineItem, 'id' | 'contract_id' | 'created_at' | 'updated_at'>
  ): Promise<ApiResponse<ContractLineItem>> => {
    const response = await axiosClient.post<ApiResponse<ContractLineItem>>(`/contracts/${contractId}/items`, payload);
    return response.data;
  },

  updateItem: async (
    contractId: string,
    itemId: string,
    payload: Partial<ContractLineItem>
  ): Promise<ApiResponse<ContractLineItem>> => {
    const response = await axiosClient.put<ApiResponse<ContractLineItem>>(`/contracts/${contractId}/items/${itemId}`, payload);
    return response.data;
  },

  deleteItem: async (contractId: string, itemId: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/contracts/${contractId}/items/${itemId}`);
    return response.data;
  },

  // Schedules
  addSchedule: async (
    contractId: string,
    itemId: string,
    payload: Omit<ContractItemSchedule, 'id' | 'contract_item_id' | 'created_at' | 'updated_at'>
  ): Promise<ApiResponse<ContractItemSchedule>> => {
    const response = await axiosClient.post<ApiResponse<ContractItemSchedule>>(`/contracts/${contractId}/items/${itemId}/schedules`, payload);
    return response.data;
  },

  updateSchedule: async (
    contractId: string,
    itemId: string,
    scheduleId: string,
    payload: Partial<ContractItemSchedule>
  ): Promise<ApiResponse<ContractItemSchedule>> => {
    const response = await axiosClient.put<ApiResponse<ContractItemSchedule>>(`/contracts/${contractId}/items/${itemId}/schedules/${scheduleId}`, payload);
    return response.data;
  },

  deleteSchedule: async (contractId: string, itemId: string, scheduleId: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/contracts/${contractId}/items/${itemId}/schedules/${scheduleId}`);
    return response.data;
  },

  toggleScheduleCompletion: async (
    contractId: string,
    itemId: string,
    scheduleId: string,
    is_completed: boolean
  ): Promise<ApiResponse<ContractItemSchedule>> => {
    const response = await axiosClient.patch<ApiResponse<ContractItemSchedule>>(
      `/contracts/${contractId}/items/${itemId}/schedules/${scheduleId}/completion`,
      { is_completed }
    );
    return response.data;
  },

  // Documents
  uploadDocument: async (contractId: string, formData: FormData): Promise<ApiResponse<ContractDocumentItem>> => {
    const response = await axiosClient.post<ApiResponse<ContractDocumentItem>>(`/contracts/${contractId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteDocument: async (contractId: string, documentId: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/contracts/${contractId}/documents/${documentId}`);
    return response.data;
  },

  // Payments
  recordPayment: async (
    contractId: string,
    payload: RecordContractPaymentInput
  ): Promise<ApiResponse<{ payment: ContractPaymentItem; contract: ContractItemModel }>> => {
    const response = await axiosClient.post<ApiResponse<{ payment: ContractPaymentItem; contract: ContractItemModel }>>(
      `/contracts/${contractId}/payments`,
      payload
    );
    return response.data;
  },

  getPayments: async (contractId: string): Promise<ApiResponse<ContractPaymentItem[]>> => {
    const response = await axiosClient.get<ApiResponse<ContractPaymentItem[]>>(`/contracts/${contractId}/payments`);
    return response.data;
  },

  // Event / Global Contract Dashboard & Metrics
  getDashboard: async (params?: { society_id?: string; event_id?: string }): Promise<ApiResponse<ContractDashboardStats>> => {
    const response = await axiosClient.get<ApiResponse<ContractDashboardStats>>('/contracts/dashboard', {
      params,
    });
    return response.data;
  },

  getEventDashboard: async (eventId: string): Promise<ApiResponse<ContractDashboardStats>> => {
    const response = await axiosClient.get<ApiResponse<ContractDashboardStats>>(`/contracts/dashboard/${eventId}`);
    return response.data;
  },
};
