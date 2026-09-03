import axiosClient from './axiosClient';
import { ApiResponse, PaginatedResponse, QueryParams, ReportExportRequest, ReportExportResponse } from '../types';

export const reportsService = {
  getSocietiesReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/societies', { params });
    return response.data;
  },

  getBlocksReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/blocks', { params });
    return response.data;
  },

  getFlatsReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/flats', { params });
    return response.data;
  },

  getBungalowsReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/bungalows', { params });
    return response.data;
  },

  getResidentsReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/residents', { params });
    return response.data;
  },

  getEventsReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/events', { params });
    return response.data;
  },

  getCollectionsReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/collections', { params });
    return response.data;
  },

  getPendingCollectionsReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/pending-collections', { params });
    return response.data;
  },

  getPaymentsReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/payments', { params });
    return response.data;
  },

  getSponsorshipsReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/sponsorships', { params });
    return response.data;
  },

  getExpensesReport: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await axiosClient.get<PaginatedResponse<any>>('/reports/expenses', { params });
    return response.data;
  },

  getEventFinancialReport: async (eventId: string): Promise<any> => {
    const response = await axiosClient.get<any>(`/reports/events`, { params: { eventId } });
    return response.data;
  },

  getCollectionReport: async (params?: any): Promise<any> => {
    return reportsService.getCollectionsReport(params);
  },

  getSponsorshipReport: async (params?: any): Promise<any> => {
    return reportsService.getSponsorshipsReport(params);
  },

  getResidentReport: async (params?: any): Promise<any> => {
    return reportsService.getResidentsReport(params);
  },

  getPaymentReport: async (params?: any): Promise<any> => {
    return reportsService.getPaymentsReport(params);
  },

  exportReport: async (payload: ReportExportRequest): Promise<ApiResponse<ReportExportResponse>> => {
    const response = await axiosClient.post<ApiResponse<ReportExportResponse>>('/reports/export', payload);
    return response.data;
  },
};
