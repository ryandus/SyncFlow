/**
 * SyncFlow: Forensic DVR Clock-Drift & Timeline Calibrator
 * Core Forensic Data Models & Types
 * Engineered by R. Hanks
 */

export interface ExifData {
  dateTimeOriginal?: string;
  subSecTimeOriginal?: string;
  parsedDate?: Date | null;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  fNumber?: string;
  exposureTime?: string;
  iso?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: string;
  gpsTimestamp?: string;
  rawTags?: Record<string, any>;
}

export interface CropROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PreprocessOptions {
  grayscale: boolean;
  invert: boolean;
  contrast: number; // 0 to 200 (100 = normal)
  brightness: number; // -100 to 100 (0 = normal)
  threshold: number; // 0 to 255 (0 = disabled/adaptive)
}

export interface DVRTimeRecord {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  rawOcrText: string;
  ocrConfidence: number;
  isVerified: boolean;
}

export interface ReferenceTimeRecord {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  source: 'exif' | 'gps' | 'nist' | 'manual';
  sourceDetails: string;
}

export type ClockDirection = 'FAST' | 'SLOW' | 'SYNCHRONIZED';

export interface DriftCalculationResult {
  deltaMs: number;
  deltaSeconds: number;
  signedOffsetStr: string; // e.g. "+00:04:12.450" or "-00:01:05.200"
  direction: ClockDirection;
  humanSummary: string;
  mathematicalFormula: string;
  levaNarrative: string;
  uncertaintyEstimateMs: number;
}

export interface IncidentMilestone {
  id: string;
  label: string;
  dvrTimestamp: string;
  calibratedTimestamp: string;
  notes?: string;
}

export interface MultiPointCalibration {
  enabled: boolean;
  t1Dvr?: Date;
  t1Ref?: Date;
  t2Dvr?: Date;
  t2Ref?: Date;
  driftRateSecondsPerDay?: number;
  driftRatePpm?: number; // parts per million
}

export interface CaseMetadata {
  caseNumber: string;
  agency: string;
  examiner: string;
  evidenceId: string;
  dvrMake: string;
  dvrModel: string;
  dvrSerial: string;
  location: string;
  examinationDate: string;
  notes: string;
}

export interface ForensicEvidenceState {
  imageFile: File | null;
  imageSrc: string | null;
  imageFileName: string;
  imageFileSize: number;
  sha256Hash: string;
  exif: ExifData | null;
  cropRoi: CropROI;
  preprocess: PreprocessOptions;
  croppedDataUrl: string | null;
  preprocessedDataUrl: string | null;
  dvrTime: DVRTimeRecord;
  referenceTime: ReferenceTimeRecord;
  driftResult: DriftCalculationResult | null;
  caseMetadata: CaseMetadata;
  milestones: IncidentMilestone[];
  multiPoint: MultiPointCalibration;
  isOcrProcessing: boolean;
  ocrProgress: number;
  ocrStatusMessage: string;
}
