import { settingsService } from './settingsService';
import { eventsService } from './eventsService';

export interface SocietyUpiQrConfig {
  upi_id: string; // e.g. "rosewood@okhdfcbank"
  upi_payee_name: string; // e.g. "Rosewood Estate Cultural Committee"
  qr_mode: 'dynamic_upi' | 'custom_image';
  custom_qr_image_url?: string;
  is_configured: boolean;
}

export const DEFAULT_UPI_CONFIG: SocietyUpiQrConfig = {
  upi_id: 'rosewoodestate@icici',
  upi_payee_name: 'Rosewood Estate Society',
  qr_mode: 'dynamic_upi',
  custom_qr_image_url: '',
  is_configured: true,
};

const SETTINGS_KEY = 'society_payment_upi_config';
const EVENT_NAME = 'society_upi_config_updated';

// In-memory cache
let cachedConfig: SocietyUpiQrConfig | null = null;

export const paymentQrService = {
  /**
   * Builds the official NPCI UPI Deep Link URL for dynamic QR code generation
   */
  buildUpiUrl: (params: {
    upiId: string;
    payeeName: string;
    amount?: number;
    transactionNote?: string;
  }): string => {
    const { upiId, payeeName, amount, transactionNote } = params;
    const cleanUpi = (upiId || '').trim();
    const cleanName = (payeeName || 'Society Payment').trim();
    
    if (!cleanUpi) return '';

    const queryParts = [
      `pa=${encodeURIComponent(cleanUpi)}`,
      `pn=${encodeURIComponent(cleanName)}`,
      `cu=INR`,
    ];

    if (amount !== undefined && amount > 0) {
      queryParts.push(`am=${amount.toFixed(2)}`);
    }

    if (transactionNote) {
      queryParts.push(`tn=${encodeURIComponent(transactionNote.slice(0, 80))}`);
    }

    return `upi://pay?${queryParts.join('&')}`;
  },

  /**
   * Fetch current UPI QR Configuration
   */
  getUpiQrConfig: async (eventId?: string): Promise<SocietyUpiQrConfig> => {
    // 1. Try to load from Event configuration if eventId is provided
    if (eventId) {
      try {
        const eventRes = await eventsService.getById(eventId);
        const otherConfig = (eventRes.data as any)?.configuration?.other_config || (eventRes.data as any)?.other_config;
        if (otherConfig && (otherConfig.upi_id || otherConfig.custom_qr_image_url)) {
          return {
            upi_id: otherConfig.upi_id || DEFAULT_UPI_CONFIG.upi_id,
            upi_payee_name: otherConfig.upi_payee_name || DEFAULT_UPI_CONFIG.upi_payee_name,
            qr_mode: otherConfig.qr_mode || 'dynamic_upi',
            custom_qr_image_url: otherConfig.custom_qr_image_url || '',
            is_configured: !!otherConfig.upi_id || !!otherConfig.custom_qr_image_url,
          };
        }
      } catch (e) {
        console.warn('Failed to load event specific QR config', e);
      }
    }

    // 2. Return cached config if fresh
    if (cachedConfig) {
      return cachedConfig;
    }

    // 2b. Check localStorage for instant persistent access
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('society_upi_qr_config');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && (parsed.upi_id || parsed.custom_qr_image_url)) {
            cachedConfig = parsed;
            return parsed;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // 3. Fetch from System Settings
    try {
      const res = await settingsService.getAll();
      const settingsList = res.data || [];
      const upiSetting = settingsList.find((s) => s.key === SETTINGS_KEY);
      
      if (upiSetting && upiSetting.value_json) {
        const val = upiSetting.value_json as any;
        cachedConfig = {
          upi_id: val.upi_id || DEFAULT_UPI_CONFIG.upi_id,
          upi_payee_name: val.upi_payee_name || DEFAULT_UPI_CONFIG.upi_payee_name,
          qr_mode: val.qr_mode || 'dynamic_upi',
          custom_qr_image_url: val.custom_qr_image_url || '',
          is_configured: !!val.upi_id || !!val.custom_qr_image_url,
        };
        return cachedConfig;
      }
    } catch (e) {
      console.warn('Failed to fetch system UPI settings, using default fallback', e);
    }

    cachedConfig = { ...DEFAULT_UPI_CONFIG };
    return cachedConfig;
  },

  /**
   * Save or Update UPI QR Configuration
   */
  saveUpiQrConfig: async (
    config: Partial<SocietyUpiQrConfig>,
    eventId?: string
  ): Promise<SocietyUpiQrConfig> => {
    const current = cachedConfig || { ...DEFAULT_UPI_CONFIG };
    const merged: SocietyUpiQrConfig = {
      ...current,
      ...config,
      is_configured: true,
    };

    // Update in-memory cache and localStorage
    cachedConfig = merged;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('society_upi_qr_config', JSON.stringify(merged));
      } catch (e) {
        // ignore
      }
    }

    // Persist to System Settings (Primary)
    try {
      await settingsService.update(SETTINGS_KEY, {
        value: merged,
        description: 'Society UPI Payment QR Configuration and Details',
      });
    } catch (e) {
      console.warn('Failed to persist UPI settings to backend API', e);
    }

    // Also persist to event configuration if eventId given
    if (eventId) {
      try {
        await eventsService.configure(eventId, {
          other_config: {
            upi_id: merged.upi_id,
            upi_payee_name: merged.upi_payee_name,
            qr_mode: merged.qr_mode,
            custom_qr_image_url: merged.custom_qr_image_url,
          },
        });
      } catch (e) {
        console.warn('Failed to update event configuration with UPI QR', e);
      }
    }

    // Broadcast update across the entire client app
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
    }

    return merged;
  },

  /**
   * Subscribe to live updates of UPI QR config
   */
  subscribe: (callback: (config: SocietyUpiQrConfig) => void) => {
    if (typeof window === 'undefined') return () => {};
    const handler = (e: any) => {
      if (e.detail) {
        callback(e.detail);
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  },
};
