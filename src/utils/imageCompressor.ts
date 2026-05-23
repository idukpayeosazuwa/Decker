/**
 * High-performance client-side image compressor using HTML5 canvas.
 * Resizes images and converts them to optimized JPEGs to fit comfortably
 * under the Firestore 1MB document size limit.
 */
export function compressImage(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a local data URI (e.g. Unsplash or already hosted image), keep as-is
    if (!dataUrl.startsWith('data:')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate optimized bounding box maintaining aspect ratios
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);
        // Export as optimized JPEG
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl); // Fallback to original
      }
    };

    img.onerror = () => {
      resolve(dataUrl); // Fallback to original on failure
    };

    img.src = dataUrl;
  });
}
