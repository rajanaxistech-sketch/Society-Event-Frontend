import envConfig from '../config/env.config';

const STAGE_HOST = 'https://api-societymgmt.anaxistech.com';
const LOCAL_HOST = 'http://localhost:6090';

/**
 * Resolves any file URL (whether relative /uploads, local localhost:3000/6090, or stage)
 * into a valid, reachable URL for the current active environment.
 */
export const getFileUrl = (url?: string | null): string => {
  if (!url) return '';

  // 1. Data URLs or Blobs (local preview during file upload)
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // 2. If the URL contains an `/uploads/` path (from local, stage, frontend port 3000, etc.)
  const uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativePath = url.substring(uploadsIndex); // e.g. '/uploads/circulars/xyz.pdf'
    const backendBase = envConfig.apiUrl.replace(/\/api(\/v\d+)?\/?$/, '');
    return `${backendBase}${relativePath}`;
  }

  // 3. If it's an absolute external URL (e.g. AWS S3, Google Cloud, Cloudinary)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 4. Default fallback: prepend current backend base
  const backendBase = envConfig.apiUrl.replace(/\/api(\/v\d+)?\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanPath}`;
};

/**
 * Returns alternate URLs (local and stage) for a given uploads path
 * so users can switch sources if a document was uploaded to a different server.
 */
export const getAlternateFileUrls = (url?: string | null) => {
  if (!url) return { current: '', local: '', stage: '' };

  const uploadsIndex = url.indexOf('/uploads/');
  const relativePath = uploadsIndex !== -1 ? url.substring(uploadsIndex) : (url.startsWith('/') ? url : `/${url}`);

  return {
    current: getFileUrl(url),
    local: `${LOCAL_HOST}${relativePath}`,
    stage: `${STAGE_HOST}${relativePath}`,
  };
};

/**
 * Downloads a file directly via browser anchor
 */
export const downloadFile = (url: string, filename?: string): void => {
  const fullUrl = getFileUrl(url);
  if (!fullUrl) return;

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
 * Formats byte size into human readable string (KB, MB, GB)
 */
export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
