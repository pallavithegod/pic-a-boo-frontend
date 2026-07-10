const API_BASE_URL = 'http://localhost:3000/api';

// Fetch all images
export const fetchImages = async () => {
  const response = await fetch(`${API_BASE_URL}/images`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch images');
  }
  return response.json();
};

// Read a File object as a base64 data URL (replaces S3 upload)
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Upload local file: compress → read as base64 → return data URL
// onProgress is called with 0..100 to simulate progress
export const uploadLocalFile = async (blob, onProgress) => {
  // Simulate staged progress: reading is nearly instant but we animate it
  onProgress?.(20);
  const dataUrl = await readFileAsDataURL(blob);
  onProgress?.(90);
  return dataUrl;
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
