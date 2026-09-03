import { envConfig } from "../config/env.config";

/**
 * Standardized API Client
 * Centralizes request handling, environment base URLs, authentication headers,
 * JSON serialization, query parameter handling, and unified error responses.
 */
class ApiClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || envConfig.apiUrl;
    this.timeout = config.timeout || envConfig.apiTimeout;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.headers,
    };
    this.authToken = null;
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Set authentication token (JWT/Bearer)
   * @param {string|null} token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Get current auth token (from state or localStorage fallback)
   */
  getAuthToken() {
    if (this.authToken) return this.authToken;
    try {
      return localStorage.getItem("token") || localStorage.getItem("authToken");
    } catch {
      return null;
    }
  }

  /**
   * Add a request interceptor: fn(url, options) -> options
   */
  addRequestInterceptor(fn) {
    this.requestInterceptors.push(fn);
  }

  /**
   * Add a response interceptor: fn(response, data) -> data
   */
  addResponseInterceptor(fn) {
    this.responseInterceptors.push(fn);
  }

  /**
   * Builds complete URL handling leading/trailing slashes and query parameters
   */
  buildUrl(endpoint, params = {}) {
    // If endpoint is already an absolute URL, use it directly
    let fullUrl = endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : `${this.baseUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;

    // Append search params if any
    const queryEntries = Object.entries(params).filter(
      ([, val]) => val !== undefined && val !== null && val !== ""
    );

    if (queryEntries.length > 0) {
      const queryString = new URLSearchParams(queryEntries).toString();
      fullUrl += (fullUrl.includes("?") ? "&" : "?") + queryString;
    }

    return fullUrl;
  }

  /**
   * Core request execution with timeout and error handling
   */
  async request(endpoint, options = {}) {
    const {
      method = "GET",
      body,
      headers = {},
      params,
      timeout = this.timeout,
      ...customConfig
    } = options;

    const url = this.buildUrl(endpoint, params);

    // Prepare headers
    const reqHeaders = { ...this.defaultHeaders, ...headers };
    const token = this.getAuthToken();
    if (token && !reqHeaders.Authorization) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }

    // Support FormData (remove Content-Type so browser sets boundary automatically)
    if (body instanceof FormData) {
      delete reqHeaders["Content-Type"];
    }

    let fetchOptions = {
      method,
      headers: reqHeaders,
      ...customConfig,
    };

    if (body) {
      fetchOptions.body =
        body instanceof FormData || typeof body === "string"
          ? body
          : JSON.stringify(body);
    }

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      fetchOptions = (await interceptor(url, fetchOptions)) || fetchOptions;
    }

    // Setup abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Parse JSON or text response
      let data = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        try {
          data = await response.text();
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        const error = new Error(
          (data && (data.message || data.error)) ||
            `HTTP ${response.status}: ${response.statusText}`
        );
        error.status = response.status;
        error.data = data;
        error.response = response;
        throw error;
      }

      // Run response interceptors
      for (const interceptor of this.responseInterceptors) {
        data = (await interceptor(response, data)) || data;
      }

      return {
        success: true,
        status: response.status,
        data,
      };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        return {
          success: false,
          status: 408,
          message: `Request timed out after ${timeout}ms`,
          isTimeout: true,
        };
      }

      return {
        success: false,
        status: err.status || 500,
        message: err.message || "An unexpected network error occurred",
        data: err.data || null,
        isError: true,
      };
    }
  }

  // Convenience HTTP methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: "POST", body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: "PUT", body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: "PATCH", body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

// Global default instance configured for the active environment
export const apiClient = new ApiClient();

export default apiClient;
