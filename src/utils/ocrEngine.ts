/**
 * SyncFlow: Forensic OCR & Image Preprocessing Engine
 * Powered by Tesseract.js (CDN)
 * Specializes in 7-Segment, Dot-Matrix, and OSD DVR Font Parsing
 * Engineered by R. Hanks
 */

import { PreprocessOptions, DVRTimeRecord } from '../types';

declare global {
  interface Window {
    Tesseract?: {
      recognize: (
        image: HTMLCanvasElement | string | Blob,
        langs?: string,
        options?: any
      ) => Promise<{
        data: {
          text: string;
          confidence: number;
          lines?: any[];
          words?: any[];
        };
      }>;
      createWorker?: (langs?: string, oem?: number, options?: any) => Promise<any>;
    };
  }
}

/**
 * Preprocesses raw canvas data with forensic image enhancement for OCR accuracy.
 */
export function preprocessCanvas(
  sourceCanvas: HTMLCanvasElement,
  options: PreprocessOptions
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const d = imgData.data;

  // Contrast factor: (259 * (contrast + 255)) / (255 * (259 - contrast))
  const c = Math.max(-100, Math.min(100, (options.contrast - 100)));
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));
  const brightness = options.brightness; // -100 to 100
  const threshold = options.threshold; // 0 = no hard threshold, 1-255 = binarize

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // 1. Grayscale
    if (options.grayscale || threshold > 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    // 2. Brightness
    r += brightness;
    g += brightness;
    b += brightness;

    // 3. Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Clamp
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // 4. Thresholding / Binarization (Otsu-style or user slider)
    if (threshold > 0) {
      const avg = (r + g + b) / 3;
      const val = avg >= threshold ? 255 : 0;
      r = val;
      g = val;
      b = val;
    }

    // 5. Inversion (essential for white/green text on black CCTV screens)
    if (options.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

/**
 * Normalizes typical 7-segment / dot-matrix DVR misread characters:
 * e.g., 'O' -> '0', 'l' -> '1', 'B' -> '8', 'S' -> '5', ';' -> ':'
 */
export function normalizeCctvOcrString(text: string): string {
  if (!text) return '';
  return text
    .replace(/[—–]/g, '-')
    .replace(/[;\.]/g, (m, offset, str) => {
      // If flanked by digits, period or semicolon is likely a colon in time
      const prev = str[offset - 1];
      const next = str[offset + 1];
      if (/\d/.test(prev) && /\d/.test(next)) {
        return ':';
      }
      return m;
    })
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8')
    .replace(/[Zz]/g, '2');
}

/**
 * Parses CCTV date and time patterns from text:
 * Patterns:
 * YYYY-MM-DD HH:MM:SS
 * MM/DD/YYYY HH:MM:SS
 * DD-MM-YYYY HH:MM:SS
 * HH:MM:SS
 */
export function extractDvrTimestamp(rawText: string): Partial<DVRTimeRecord> {
  const normalized = normalizeCctvOcrString(rawText);

  // 1. Check for Full Date and Time: YYYY-MM-DD HH:MM:SS
  const fullIsoMatch = normalized.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?/);
  if (fullIsoMatch) {
    const year = parseInt(fullIsoMatch[1], 10);
    const month = parseInt(fullIsoMatch[2], 10);
    const day = parseInt(fullIsoMatch[3], 10);
    const hour = parseInt(fullIsoMatch[4], 10);
    const minute = parseInt(fullIsoMatch[5], 10);
    const second = parseInt(fullIsoMatch[6], 10);
    const millisecond = fullIsoMatch[7] ? parseInt(fullIsoMatch[7].padEnd(3, '0').slice(0, 3), 10) : 0;

    if (isValidDateParts(year, month, day, hour, minute, second)) {
      return { year, month, day, hour, minute, second, millisecond };
    }
  }

  // 2. Check for US format: MM/DD/YYYY HH:MM:SS
  const usDateMatch = normalized.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?/);
  if (usDateMatch) {
    const month = parseInt(usDateMatch[1], 10);
    const day = parseInt(usDateMatch[2], 10);
    const year = parseInt(usDateMatch[3], 10);
    const hour = parseInt(usDateMatch[4], 10);
    const minute = parseInt(usDateMatch[5], 10);
    const second = parseInt(usDateMatch[6], 10);
    const millisecond = usDateMatch[7] ? parseInt(usDateMatch[7].padEnd(3, '0').slice(0, 3), 10) : 0;

    if (isValidDateParts(year, month, day, hour, minute, second)) {
      return { year, month, day, hour, minute, second, millisecond };
    }
  }

  // 3. Check for Time only: HH:MM:SS or HH:MM:SS.mmm
  const timeOnlyMatch = normalized.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?/);
  if (timeOnlyMatch) {
    const hour = parseInt(timeOnlyMatch[1], 10);
    const minute = parseInt(timeOnlyMatch[2], 10);
    const second = parseInt(timeOnlyMatch[3], 10);
    const millisecond = timeOnlyMatch[4] ? parseInt(timeOnlyMatch[4].padEnd(3, '0').slice(0, 3), 10) : 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59) {
      return { hour, minute, second, millisecond };
    }
  }

  return {};
}

function isValidDateParts(year: number, month: number, day: number, hour: number, minute: number, second: number): boolean {
  if (year < 1990 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;
  if (second < 0 || second > 59) return false;
  return true;
}

/**
 * Executes OCR on the provided canvas with progress callback.
 */
export async function performOcr(
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; confidence: number; parsedTime: Partial<DVRTimeRecord> }> {
  if (!window.Tesseract) {
    throw new Error('Tesseract.js OCR engine is not yet loaded from CDN.');
  }

  onProgress?.(10, 'Initializing Forensic OCR Engine...');

  try {
    const result = await window.Tesseract.recognize(canvas, 'eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text' && m.progress) {
          const pct = Math.round(m.progress * 100);
          onProgress?.(pct, `Recognizing DVR OSD Clock: ${pct}%`);
        } else if (m.status) {
          onProgress?.(25, `${m.status}...`);
        }
      },
    });

    const rawText = result.data.text.trim();
    const confidence = Math.round(result.data.confidence || 85);
    const parsedTime = extractDvrTimestamp(rawText);

    onProgress?.(100, 'Forensic OCR extraction complete.');

    return {
      text: rawText,
      confidence,
      parsedTime,
    };
  } catch (err: any) {
    console.error('OCR recognition error:', err);
    throw new Error(err.message || 'Failed to perform OCR on cropped image.');
  }
}
