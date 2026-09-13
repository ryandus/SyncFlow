/**
 * SyncFlow: Forensic EXIF Metadata Parser
 * Powered by ExifReader (CDN)
 * Extracts DateTimeOriginal, SubSecTimeOriginal, Camera Hardware, and GPS Metadata
 * Engineered by R. Hanks
 */

import { ExifData } from '../types';

declare global {
  interface Window {
    ExifReader?: {
      load: (data: ArrayBuffer | Blob | ArrayBufferView, options?: any) => Promise<any> | any;
    };
  }
}

export async function parseExifMetadata(fileOrBuffer: File | Blob | ArrayBuffer): Promise<ExifData> {
  const result: ExifData = {
    dateTimeOriginal: undefined,
    subSecTimeOriginal: undefined,
    parsedDate: null,
    cameraMake: undefined,
    cameraModel: undefined,
    lensModel: undefined,
    fNumber: undefined,
    exposureTime: undefined,
    iso: undefined,
    gpsLatitude: undefined,
    gpsLongitude: undefined,
    gpsAltitude: undefined,
    gpsTimestamp: undefined,
    rawTags: {},
  };

  try {
    let buffer: ArrayBuffer;
    if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
      buffer = await fileOrBuffer.arrayBuffer();
    } else {
      buffer = fileOrBuffer;
    }

    if (!window.ExifReader) {
      console.warn('SyncFlow: ExifReader CDN not yet loaded or unavailable.');
      return result;
    }

    const tags = await window.ExifReader.load(buffer, { expanded: true });
    result.rawTags = tags;

    // Support both expanded and flat tag structures
    const exifGroup = tags.exif || tags;
    const fileGroup = tags.file || {};
    const gpsGroup = tags.gps || tags;

    // 1. Extract DateTimeOriginal
    const dtTag = exifGroup.DateTimeOriginal || tags.DateTimeOriginal || exifGroup.CreateDate;
    if (dtTag) {
      result.dateTimeOriginal = typeof dtTag === 'object' && dtTag.description ? dtTag.description : String(dtTag.value || dtTag);
    }

    // 2. Extract SubSecTimeOriginal (millisecond precision)
    const subSecTag = exifGroup.SubSecTimeOriginal || tags.SubSecTimeOriginal || exifGroup.SubSecTimeDigitized || exifGroup.SubSecTime;
    if (subSecTag) {
      result.subSecTimeOriginal = typeof subSecTag === 'object' && subSecTag.description ? subSecTag.description : String(subSecTag.value || subSecTag);
    }

    // 3. Extract Camera Hardware
    const makeTag = exifGroup.Make || tags.Make;
    if (makeTag) {
      result.cameraMake = typeof makeTag === 'object' && makeTag.description ? makeTag.description : String(makeTag.value || makeTag);
    }

    const modelTag = exifGroup.Model || tags.Model;
    if (modelTag) {
      result.cameraModel = typeof modelTag === 'object' && modelTag.description ? modelTag.description : String(modelTag.value || modelTag);
    }

    const lensTag = exifGroup.LensModel || tags.LensModel || exifGroup.Lens;
    if (lensTag) {
      result.lensModel = typeof lensTag === 'object' && lensTag.description ? lensTag.description : String(lensTag.value || lensTag);
    }

    const fNumberTag = exifGroup.FNumber || tags.FNumber || exifGroup.ApertureValue;
    if (fNumberTag) {
      result.fNumber = typeof fNumberTag === 'object' && fNumberTag.description ? fNumberTag.description : String(fNumberTag.value || fNumberTag);
    }

    const expTag = exifGroup.ExposureTime || tags.ExposureTime || exifGroup.ShutterSpeedValue;
    if (expTag) {
      result.exposureTime = typeof expTag === 'object' && expTag.description ? expTag.description : String(expTag.value || expTag);
    }

    const isoTag = exifGroup.ISOSpeedRatings || tags.ISOSpeedRatings || exifGroup.ISO;
    if (isoTag) {
      result.iso = typeof isoTag === 'object' && isoTag.description ? isoTag.description : String(isoTag.value || isoTag);
    }

    // 4. Extract GPS Metadata
    if (gpsGroup.Latitude !== undefined || gpsGroup.GPSLatitude !== undefined) {
      const latVal = gpsGroup.Latitude !== undefined ? gpsGroup.Latitude : gpsGroup.GPSLatitude?.description;
      result.gpsLatitude = typeof latVal === 'number' ? latVal : parseFloat(String(latVal));
    }

    if (gpsGroup.Longitude !== undefined || gpsGroup.GPSLongitude !== undefined) {
      const lonVal = gpsGroup.Longitude !== undefined ? gpsGroup.Longitude : gpsGroup.GPSLongitude?.description;
      result.gpsLongitude = typeof lonVal === 'number' ? lonVal : parseFloat(String(lonVal));
    }

    if (gpsGroup.Altitude !== undefined || gpsGroup.GPSAltitude !== undefined) {
      const altVal = gpsGroup.Altitude !== undefined ? gpsGroup.Altitude : gpsGroup.GPSAltitude?.description;
      result.gpsAltitude = String(altVal);
    }

    if (gpsGroup.GPSTimeStamp || gpsGroup.GPSDateStamp) {
      const gDate = gpsGroup.GPSDateStamp?.description || '';
      const gTime = gpsGroup.GPSTimeStamp?.description || '';
      result.gpsTimestamp = `${gDate} ${gTime}`.trim();
    }

    // 5. Parse DateTimeOriginal into JS Date with SubSec milliseconds
    if (result.dateTimeOriginal) {
      result.parsedDate = parseExifDateStringToDate(result.dateTimeOriginal, result.subSecTimeOriginal);
    }

  } catch (err) {
    console.error('SyncFlow: Error parsing EXIF via ExifReader:', err);
  }

  return result;
}

/**
 * Standard EXIF date format is 'YYYY:MM:DD HH:MM:SS' or ISO 'YYYY-MM-DDTHH:MM:SS'
 */
export function parseExifDateStringToDate(dateStr: string, subSecStr?: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  try {
    // Normalization: Replace first two colons in date with hyphens: 2024:10:14 14:23:45 -> 2024-10-14 14:23:45
    let clean = dateStr.trim();
    const parts = clean.split(' ');
    if (parts.length >= 2) {
      const datePart = parts[0].replace(/:/g, '-');
      const timePart = parts[1];
      clean = `${datePart}T${timePart}`;
    }

    const date = new Date(clean);
    if (isNaN(date.getTime())) {
      // Manual regex fallback
      const match = dateStr.match(/(\d{4})[:/-](\d{1,2})[:/-](\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const hour = parseInt(match[4], 10);
        const minute = parseInt(match[5], 10);
        const second = parseInt(match[6], 10);
        let ms = 0;
        if (subSecStr) {
          const rawMs = parseInt(subSecStr.replace(/\D/g, '').padEnd(3, '0').slice(0, 3), 10);
          if (!isNaN(rawMs)) ms = rawMs;
        }
        return new Date(year, month, day, hour, minute, second, ms);
      }
      return null;
    }

    // Attach millisecond sub-seconds if present
    if (subSecStr) {
      const rawMs = parseInt(subSecStr.replace(/\D/g, '').padEnd(3, '0').slice(0, 3), 10);
      if (!isNaN(rawMs)) {
        date.setMilliseconds(rawMs);
      }
    }

    return date;
  } catch {
    return null;
  }
}
