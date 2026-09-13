/**
 * SyncFlow: Authentic Forensic Demo Test Cases & Canvas Generator
 * Provides realistic CCTV DVR camera displays and authentic EXIF data
 * Engineered by R. Hanks
 */

import { ExifData, CaseMetadata, DVRTimeRecord, ReferenceTimeRecord } from '../types';

export interface ForensicDemoCase {
  id: string;
  title: string;
  dvrModel: string;
  caseType: string;
  description: string;
  caseMetadata: CaseMetadata;
  dvrTime: DVRTimeRecord;
  referenceTime: ReferenceTimeRecord;
  exif: ExifData;
  cropDefault: { x: number; y: number; width: number; height: number };
  renderCanvas: () => HTMLCanvasElement;
}

export function createDemoCanvas(
  cameraName: string,
  dvrTimeString: string,
  style: 'hikvision' | 'dahua' | 'hanwha'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw CCTV Camera Room / Background Scene (Dark Surveillance Environment)
  const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
  if (style === 'hikvision') {
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#090d16');
  } else if (style === 'dahua') {
    bgGrad.addColorStop(0, '#111827');
    bgGrad.addColorStop(0.5, '#1f2937');
    bgGrad.addColorStop(1, '#0b0f19');
  } else {
    bgGrad.addColorStop(0, '#18181b');
    bgGrad.addColorStop(0.5, '#27272a');
    bgGrad.addColorStop(1, '#09090b');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1280, 720);

  // 2. Draw Simulated CCTV Environment Elements (Shelves, Counter, Doorway, Perspective Lines)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  // Perspective lines (corridor / retail store)
  ctx.beginPath();
  ctx.moveTo(100, 720);
  ctx.lineTo(480, 320);
  ctx.lineTo(800, 320);
  ctx.lineTo(1180, 720);
  ctx.stroke();

  // Draw doorway / counter outline
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(520, 240, 240, 260);
  ctx.strokeStyle = '#475569';
  ctx.strokeRect(520, 240, 240, 260);

  // Shelves / structural grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let y = 100; y < 720; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }

  // 3. Subtle CCTV Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  for (let y = 0; y < 720; y += 4) {
    ctx.fillRect(0, y, 1280, 2);
  }

  // 4. CCTV OSD (On-Screen Display) Overlay
  // Camera Name: Top-Left
  ctx.font = 'bold 24px "Chakra Petch", "JetBrains Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(cameraName, 48, 56);

  // REC indicator badge
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cameraName.length * 15 + 80, 48, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText('REC [LIVE]', cameraName.length * 15 + 98, 54);

  // 5. DVR OSD Clock Box (Top-Right or Bottom-Right depending on model)
  // Standard CCTV OSD has dark backing or high-contrast drop shadow
  const clockX = 820;
  const clockY = 32;
  const clockWidth = 420;
  const clockHeight = 64;

  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Background banner for OSD clock
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(clockX - 10, clockY - 6, clockWidth, clockHeight);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(clockX - 10, clockY - 6, clockWidth, clockHeight);

  // Text color: Hikvision classic yellow or Dahua classic white/green
  ctx.font = 'bold 32px "Chakra Petch", "JetBrains Mono", monospace';
  if (style === 'hikvision') {
    ctx.fillStyle = '#facc15'; // CCTV Yellow
  } else if (style === 'dahua') {
    ctx.fillStyle = '#4ade80'; // CCTV Green
  } else {
    ctx.fillStyle = '#38bdf8'; // Cyan
  }
  ctx.fillText(dvrTimeString, clockX + 16, clockY + 38);

  // 6. Forensic Watermark directly on the canvas as required
  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('SyncFlow | Engineered by R. Hanks', 48, 690);

  // Forensic crosshairs / grid markings
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(640, 340);
  ctx.lineTo(640, 380);
  ctx.moveTo(620, 360);
  ctx.lineTo(660, 360);
  ctx.stroke();

  return canvas;
}

export const FORENSIC_DEMO_CASES: ForensicDemoCase[] = [
  {
    id: 'demo-hikvision-robbery',
    title: 'Demo 1: Hikvision TurboHD DVR (Convenience Store)',
    dvrModel: 'Hikvision DS-7208HUHI-K1',
    caseType: 'Armed Robbery Timeline Calibration',
    description: 'OSD displays 2024-10-14 19:42:15 while forensic camera EXIF records 2024-10-14 19:45:32.450. DVR is SLOW by -00:03:17.450.',
    caseMetadata: {
      caseNumber: 'CASE-2024-8831',
      agency: 'Metro Police Dept - Forensic Multimedia Unit',
      examiner: 'R. Hanks, Forensic Video Analyst',
      evidenceId: 'EV-04B-DVR',
      dvrMake: 'Hikvision',
      dvrModel: 'DS-7208HUHI-K1/E',
      dvrSerial: 'DS7208-HUHI-99824B',
      location: '7-Star QuickMart, 1420 Grand Blvd, Camera 02',
      examinationDate: '2024-10-15',
      notes: 'Acquisition photo captured using Nikon D850 with calibrated atomic reference clock in field of view.',
    },
    dvrTime: {
      year: 2024,
      month: 10,
      day: 14,
      hour: 19,
      minute: 42,
      second: 15,
      millisecond: 0,
      rawOcrText: '2024-10-14 19:42:15',
      ocrConfidence: 96,
      isVerified: true,
    },
    referenceTime: {
      year: 2024,
      month: 10,
      day: 14,
      hour: 19,
      minute: 45,
      second: 32,
      millisecond: 450,
      source: 'exif',
      sourceDetails: 'EXIF DateTimeOriginal + SubSecTimeOriginal (Nikon D850 Forensic Camera)',
    },
    exif: {
      dateTimeOriginal: '2024:10:14 19:45:32',
      subSecTimeOriginal: '450',
      cameraMake: 'NIKON CORPORATION',
      cameraModel: 'NIKON D850',
      lensModel: 'AF-S Nikkor 24-70mm f/2.8E ED VR',
      fNumber: 'f/4.0',
      exposureTime: '1/160s',
      iso: '400',
      gpsLatitude: 37.7749,
      gpsLongitude: -122.4194,
      gpsAltitude: '18m',
      gpsTimestamp: '2024-10-14 19:45:32 UTC',
    },
    cropDefault: {
      x: 800,
      y: 20,
      width: 450,
      height: 90,
    },
    renderCanvas: () => createDemoCanvas('CAM 02 - CASH REGISTER 1', '2024-10-14 19:42:15', 'hikvision'),
  },
  {
    id: 'demo-dahua-burglary',
    title: 'Demo 2: Dahua Technology 16-Channel NVR (Commercial Facility)',
    dvrModel: 'Dahua NVR5216-16P-4KS2E',
    caseType: 'Commercial Burglary Timeline Calibration',
    description: 'OSD displays 2024-11-02 03:15:40 while forensic camera EXIF records 2024-11-02 03:10:18.120. DVR is FAST by +00:05:21.880.',
    caseMetadata: {
      caseNumber: 'CASE-2024-9104',
      agency: 'State Bureau of Investigation - Digital Evidence Section',
      examiner: 'R. Hanks, Forensic Video Analyst',
      evidenceId: 'ITEM-01-NVR',
      dvrMake: 'Dahua Technology',
      dvrModel: 'NVR5216-16P-4KS2E',
      dvrSerial: 'DH-NVR5216-7729114',
      location: 'Apex Logistics Warehouse, Camera 04 Loading Dock',
      examinationDate: '2024-11-03',
      notes: 'Calibration photograph verified against GPS synchronized mobile terminal.',
    },
    dvrTime: {
      year: 2024,
      month: 11,
      day: 2,
      hour: 3,
      minute: 15,
      second: 40,
      millisecond: 0,
      rawOcrText: '2024-11-02 03:15:40',
      ocrConfidence: 98,
      isVerified: true,
    },
    referenceTime: {
      year: 2024,
      month: 11,
      day: 2,
      hour: 3,
      minute: 10,
      second: 18,
      millisecond: 120,
      source: 'exif',
      sourceDetails: 'EXIF DateTimeOriginal + SubSec (Apple iPhone 15 Pro Max)',
    },
    exif: {
      dateTimeOriginal: '2024:11:02 03:10:18',
      subSecTimeOriginal: '120',
      cameraMake: 'Apple',
      cameraModel: 'iPhone 15 Pro Max',
      lensModel: 'iPhone 15 Pro Max back triple camera 6.86mm f/1.78',
      fNumber: 'f/1.78',
      exposureTime: '1/60s',
      iso: '250',
      gpsLatitude: 34.0522,
      gpsLongitude: -118.2437,
      gpsAltitude: '72m',
      gpsTimestamp: '2024-11-02 03:10:18 UTC',
    },
    cropDefault: {
      x: 800,
      y: 20,
      width: 450,
      height: 90,
    },
    renderCanvas: () => createDemoCanvas('CAM 04 - DOCK BAY 3', '2024-11-02 03:15:40', 'dahua'),
  },
  {
    id: 'demo-hanwha-hitrun',
    title: 'Demo 3: Hanwha Techwin Wisenet NVR (Intersection Traffic)',
    dvrModel: 'Hanwha Wisenet QRN-810S',
    caseType: 'Fatal Hit & Run Vehicle Investigation',
    description: 'OSD displays 2024-12-08 14:02:55.300 while GPS time records 2024-12-08 14:02:56.100. DVR is SLOW by -0.800 seconds.',
    caseMetadata: {
      caseNumber: 'CASE-2024-1152',
      agency: 'Highway Patrol - Collision Reconstruction Unit',
      examiner: 'R. Hanks, Forensic Video Analyst',
      evidenceId: 'REC-03-TRAFFIC',
      dvrMake: 'Hanwha Techwin',
      dvrModel: 'Wisenet QRN-810S',
      dvrSerial: 'HW-QRN810-66412',
      location: 'Intersection 5th & Main St, Traffic Cam 01',
      examinationDate: '2024-12-09',
      notes: 'High-precision millisecond level calibration for vehicle velocity reconstruction.',
    },
    dvrTime: {
      year: 2024,
      month: 12,
      day: 8,
      hour: 14,
      minute: 2,
      second: 55,
      millisecond: 300,
      rawOcrText: '2024-12-08 14:02:55.300',
      ocrConfidence: 99,
      isVerified: true,
    },
    referenceTime: {
      year: 2024,
      month: 12,
      day: 8,
      hour: 14,
      minute: 2,
      second: 56,
      millisecond: 100,
      source: 'gps',
      sourceDetails: 'GPS NTP Calibrated Time Standard',
    },
    exif: {
      dateTimeOriginal: '2024:12:08 14:02:56',
      subSecTimeOriginal: '100',
      cameraMake: 'Canon',
      cameraModel: 'Canon EOS R5',
      lensModel: 'RF24-70mm F2.8 L IS USM',
      fNumber: 'f/2.8',
      exposureTime: '1/250s',
      iso: '100',
      gpsLatitude: 32.7157,
      gpsLongitude: -117.1611,
      gpsAltitude: '15m',
      gpsTimestamp: '2024-12-08 14:02:56 UTC',
    },
    cropDefault: {
      x: 800,
      y: 20,
      width: 450,
      height: 90,
    },
    renderCanvas: () => createDemoCanvas('CAM 01 - NORTHBOUND TRAFFIC', '2024-12-08 14:02:55.300', 'hanwha'),
  },
];
