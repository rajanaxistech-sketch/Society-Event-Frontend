import axiosClient from './axiosClient';
import { ApiResponse, AuditLogItem, PaginatedResponse, QueryParams } from '../types';

export const auditLogsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<AuditLogItem>> => {
    const response = await axiosClient.get<PaginatedResponse<AuditLogItem>>('/audit-logs', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<AuditLogItem>> => {
    const response = await axiosClient.get<ApiResponse<AuditLogItem>>(`/audit-logs/${id}`);
    return response.data;
  },
};
