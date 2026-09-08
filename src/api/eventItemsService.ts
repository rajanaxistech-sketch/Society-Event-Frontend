import axiosClient from './axiosClient';
import { ApiResponse, EventServiceItem, PaginatedResponse, QueryParams } from '../types';

export const eventItemsService = {
  listByEvent: async (
    eventId: string,
    params?: QueryParams & { category?: string; status?: string; isDefaultNavratri?: boolean }
  ): Promise<PaginatedResponse<EventServiceItem>> => {
    const response = await axiosClient.get<PaginatedResponse<EventServiceItem>>(
      `/events/${eventId}/items`,
      { params }
    );
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<EventServiceItem>> => {
    const response = await axiosClient.get<ApiResponse<EventServiceItem>>(`/event-items/${id}`);
    return response.data;
  },

  create: async (payload: {
    event_id: string;
    vendor_contract_id?: string | null;
    name: string;
    category: string;
    description?: string | null;
    vendor_name?: string | null;
    pricing_type: string;
    quantity?: number | null;
    unit?: string | null;
    base_price?: number | null;
    price_per_day?: number | null;
    number_of_days?: number | null;
    applicable_days?: any;
    day_wise_prices?: Record<string, number> | null;
    total_price?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    is_default_navratri?: boolean;
    notes?: string | null;
    status?: string;
  }): Promise<ApiResponse<EventServiceItem>> => {
    const response = await axiosClient.post<ApiResponse<EventServiceItem>>(
      `/events/${payload.event_id}/items`,
      payload
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: Partial<{
      vendor_contract_id?: string | null;
      name: string;
      category: string;
      description?: string | null;
      vendor_name?: string | null;
      pricing_type: string;
      quantity?: number | null;
      unit?: string | null;
      base_price?: number | null;
      price_per_day?: number | null;
      number_of_days?: number | null;
      applicable_days?: any;
      day_wise_prices?: Record<string, number> | null;
      total_price?: number | null;
      start_date?: string | null;
      end_date?: string | null;
      notes?: string | null;
      status?: string;
    }>
  ): Promise<ApiResponse<EventServiceItem>> => {
    const response = await axiosClient.patch<ApiResponse<EventServiceItem>>(
      `/event-items/${id}`,
      payload
    );
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `/event-items/${id}`
    );
    return response.data;
  },

  calculateCost: async (eventId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.get<ApiResponse<any>>(
      `/events/${eventId}/items/calculate-cost`
    );
    return response.data;
  },
};
