import imageCompression from 'browser-image-compression';

// Compresses image to WebP (maximum 1MB, max dimension 1920px)
export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp'
  };
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Compression failed, falling back to original file', error);
    return file;
  }
};

// Extracts natural width, height, and aspect ratio from a file
export const getImageDimensions = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      resolve({
        width,
        height,
        aspectRatio: Number((width / height).toFixed(3))
      });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve({ width: 1200, height: 800, aspectRatio: 1.5 }); // High-quality fallback defaults
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
};

// Generates an ultra-low resolution (16x16) base64 blur image placeholder using offscreen canvas
export const generateBlurPlaceholder = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Draw onto tiny canvas
      canvas.width = 16;
      canvas.height = 16;
      ctx.drawImage(img, 0, 0, 16, 16);
      const blurDataUrl = canvas.toDataURL('image/webp', 0.2);
      resolve(blurDataUrl);
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve('');
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
};
