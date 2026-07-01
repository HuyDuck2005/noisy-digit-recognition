export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const resolveApiUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

const readError = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await response.json().catch(() => null);
    if (typeof body?.detail === 'string') return body.detail;
    if (Array.isArray(body?.detail)) return body.detail.map((item) => item.msg || JSON.stringify(item)).join('; ');
    return JSON.stringify(body);
  }
  return response.text().catch(() => response.statusText);
};

const requestJson = async (url, options) => {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`Backend request failed: ${error.message}`);
  }

  if (!response.ok) {
    const message = await readError(response);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json();
};

export const healthCheck = async () => {
  return requestJson(`${API_BASE_URL}/api/health`);
};

export const getDatasetStatus = async () => {
  return requestJson(`${API_BASE_URL}/api/datasets/status`);
};

export const uploadAndProcessImage = async (imageFile, parameters) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('parameters', JSON.stringify(parameters || {}));

  return requestJson(`${API_BASE_URL}/api/process`, {
    method: 'POST',
    body: formData,
  });
};
