import axiosClient from './axiosClient';
import {
  ApiResponse,
  ImportBatchItem,
  ImportErrorItem,
  ImportRowItem,
  PaginatedResponse,
  QueryParams,
} from '../types';

export const importsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<ImportBatchItem>> => {
    const response = await axiosClient.get<PaginatedResponse<ImportBatchItem>>('/imports', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<ImportBatchItem>> => {
    const response = await axiosClient.get<ApiResponse<ImportBatchItem>>(`/imports/${id}`);
    return response.data;
  },

  downloadTemplate: async (): Promise<Blob> => {
    const response = await axiosClient.get('/imports/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  uploadExcel: async (formData: FormData): Promise<ApiResponse<ImportBatchItem>> => {
    const response = await axiosClient.post<ApiResponse<ImportBatchItem>>('/imports/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadFile: async (file: File, entityType?: string): Promise<ApiResponse<ImportBatchItem>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (entityType) {
      formData.append('entity_type', entityType);
    }
    return importsService.uploadExcel(formData);
  },

  previewRows: async (id: string, params?: QueryParams): Promise<PaginatedResponse<ImportRowItem>> => {
    const response = await axiosClient.get<PaginatedResponse<ImportRowItem>>(`/imports/${id}/preview`, { params });
    return response.data;
  },

  commit: async (id: string): Promise<ApiResponse<ImportBatchItem>> => {
    const response = await axiosClient.post<ApiResponse<ImportBatchItem>>(`/imports/${id}/commit`);
    return response.data;
  },

  getErrors: async (id: string, params?: QueryParams): Promise<PaginatedResponse<ImportErrorItem>> => {
    const response = await axiosClient.get<PaginatedResponse<ImportErrorItem>>(`/imports/${id}/errors`, { params });
    return response.data;
  },

  downloadErrorReport: async (id: string): Promise<Blob> => {
    const response = await axiosClient.get(`/imports/${id}/error-report`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
