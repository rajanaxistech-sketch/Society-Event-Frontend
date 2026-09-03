import envConfig from '../config/env.config';

/**
 * Triggers a browser download for a Blob response
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Triggers a download from a remote file URL
 */
export const downloadFileUrl = (url: string, filename?: string): void => {
  const defaultUploadsBase = envConfig.apiUrl.replace(/\/api(\/v\d+)?\/?$/, '') + '/uploads';
  const fullUrl = url.startsWith('http')
    ? url
    : `${process.env.REACT_APP_UPLOADS_URL || defaultUploadsBase}/${url.replace(/^\/+/, '')}`;

  const link = document.createElement('a');
  link.href = fullUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (filename) {
    link.setAttribute('download', filename);
  }
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Converts array of JSON objects to CSV string and triggers download
 */
export const exportToCsv = (data: Record<string, any>[], filename: string): void => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};
