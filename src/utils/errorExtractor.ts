/**
 * Parses Axios and backend API errors into user-friendly error messages
 */
export const extractErrorMessage = (error: any, fallback = 'An unexpected error occurred'): string => {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  if (error.response?.data) {
    const data = error.response.data;

    if (data.message && typeof data.message === 'string') {
      return data.message;
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.join(', ');
    }

    if (data.error && typeof data.error === 'string') {
      return data.error;
    }
  }

  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  return fallback;
};
