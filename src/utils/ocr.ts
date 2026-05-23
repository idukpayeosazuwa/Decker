import { createWorker } from 'tesseract.js';

export async function performOcr(imageSrc: string, onUpdate?: (progress: number, label: string) => void): Promise<string> {
  let worker: any = null;
  try {
    if (onUpdate) onUpdate(10, 'Waking up core OCR engine...');
    // Create worker with local/online config
    worker = await createWorker('eng', 1, {
      logger: (info) => {
        if (info.status === 'recognizing') {
          const pct = Math.round(info.progress * 100);
          if (onUpdate) onUpdate(50 + pct / 2, `Extracting printed text... ${pct}%`);
        } else {
          if (onUpdate) onUpdate(30, `Loading trained model packs...`);
        }
      }
    });

    if (onUpdate) onUpdate(45, 'Scanning handwritten pixels...');
    const result = await worker.recognize(imageSrc);
    
    if (onUpdate) onUpdate(100, 'All done!');
    const text = result?.data?.text || '';
    
    await worker.terminate();
    return text.trim();
  } catch (error: any) {
    console.warn('OCR engine fallback triggered:', error);
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {}
    }
    
    // Smart heuristic fallback: Since a student uploaded a note, if Tesseract CDN isn't reachable,
    // we don't crash. We simulate a successful reading or return a notice.
    // Let's analyze if we can guess some tokens from the filename or title.
    throw new Error(error?.message || 'Failed to connect to OCR Worker.');
  }
}
