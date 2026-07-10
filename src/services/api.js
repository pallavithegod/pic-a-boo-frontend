const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Fetch all images
export const fetchImages = async () => {
  const response = await fetch(`${API_BASE_URL}/images`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch images');
  }
  return response.json();
};

// Request a presigned URL from the backend
const getPresignedUrl = async (filename, contentType) => {
  const response = await fetch(`${API_BASE_URL}/upload/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get presigned URL');
  }
  return response.json();
};

// Upload file directly to S3 using XHR for accurate progress tracking
export const uploadToS3 = (file, filename, contentType, onProgress) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Get presigned URL
      const { presignedUrl, key, publicUrl } = await getPresignedUrl(filename, contentType);

      // 2. Upload directly to S3
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl, true);
      xhr.setRequestHeader('Content-Type', contentType);

      if (xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress?.(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ key, publicUrl });
        } else {
          reject(new Error(`S3 Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('S3 Upload network error'));
      xhr.send(file);
    } catch (error) {
      reject(error);
    }
  });
};

// Save image metadata in DB (publicUrl is a base64 data URL in local mode)
export const saveImageMetadata = async (imageData) => {
  const response = await fetch(`${API_BASE_URL}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(imageData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save image metadata');
  }
  return response.json();
};

// Delete image
export const deleteImage = async (id) => {
  const response = await fetch(`${API_BASE_URL}/images/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete image');
  }
  return response.json();
};
