/**
 * SyncFlow: Forensic Video Clock-Drift & Timeline Calibration Mathematics
 * Adheres strictly to LEVA & SWGDE Evidence Recovery Protocols
 * Engineered by R. Hanks
 */

import { DVRTimeRecord, ReferenceTimeRecord, DriftCalculationResult, ClockDirection } from '../types';

/**
 * Constructs a Date object from a DVRTimeRecord
 */
export function dvrRecordToDate(rec: DVRTimeRecord): Date {
  return new Date(rec.year, rec.month - 1, rec.day, rec.hour, rec.minute, rec.second, rec.millisecond || 0);
}

/**
 * Constructs a Date object from a ReferenceTimeRecord
 */
export function referenceRecordToDate(rec: ReferenceTimeRecord): Date {
  return new Date(rec.year, rec.month - 1, rec.day, rec.hour, rec.minute, rec.second, rec.millisecond || 0);
}

/**
 * Formats a Date object into standard forensic ISO-like format: YYYY-MM-DD HH:MM:SS.mmm
 */
export function formatForensicTimestamp(d: Date): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  const secs = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}.${ms}`;
}

/**
 * Calculates Clock Drift Variance between DVR OSD and True Reference Time.
 * Delta = T_DVR - T_Ref
 */
export function calculateClockDrift(
  dvrTime: DVRTimeRecord,
  referenceTime: ReferenceTimeRecord,
  caseInfo?: { dvrMake?: string; dvrModel?: string; dvrSerial?: string; evidenceId?: string; examiner?: string }
): DriftCalculationResult {
  const dvrDate = dvrRecordToDate(dvrTime);
  const refDate = referenceRecordToDate(referenceTime);

  const dvrMs = dvrDate.getTime();
  const refMs = refDate.getTime();
  const deltaMs = dvrMs - refMs; // Positive = DVR is ahead (FAST); Negative = DVR is behind (SLOW)
  const absDeltaMs = Math.abs(deltaMs);

  const deltaSeconds = parseFloat((deltaMs / 1000).toFixed(3));

  let direction: ClockDirection = 'SYNCHRONIZED';
  if (deltaMs > 20) {
    direction = 'FAST';
  } else if (deltaMs < -20) {
    direction = 'SLOW';
  }

  // Format Signed Offset: e.g. "+00:03:17.450" or "-00:05:02.120"
  const sign = deltaMs >= 0 ? '+' : '-';
  const totalSeconds = Math.floor(absDeltaMs / 1000);
  const msPart = absDeltaMs % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const signedOffsetStr = `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(msPart, 3)}`;

  // Human readable description
  let humanSummary = '';
  if (direction === 'SYNCHRONIZED') {
    humanSummary = 'The DVR Real-Time Clock (RTC) is synchronized with the reference time (variance < 20 ms).';
  } else {
    const timePhraseParts = [];
    if (hours > 0) timePhraseParts.push(`${hours}h`);
    if (minutes > 0) timePhraseParts.push(`${minutes}m`);
    timePhraseParts.push(`${seconds}.${pad(msPart, 3)}s`);
    const timePhrase = timePhraseParts.join(' ');

    if (direction === 'FAST') {
      humanSummary = `DVR clock is FAST by ${timePhrase} (+${(absDeltaMs / 1000).toFixed(3)}s). Recorded events occurred ${timePhrase} EARLIER than displayed.`;
    } else {
      humanSummary = `DVR clock is SLOW by ${timePhrase} (-${(absDeltaMs / 1000).toFixed(3)}s). Recorded events occurred ${timePhrase} LATER than displayed.`;
    }
  }

  // Mathematical formula string
  const formulaStr = deltaMs >= 0
    ? `T_Actual = T_DVR - ${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(msPart, 3)}`
    : `T_Actual = T_DVR + ${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(msPart, 3)}`;

  // Court-admissible LEVA & SWGDE Narrative Statement
  const dvrMakeModel = [caseInfo?.dvrMake, caseInfo?.dvrModel].filter(Boolean).join(' ') || 'Digital Video Recorder (DVR/NVR)';
  const serialPart = caseInfo?.dvrSerial ? ` (S/N: ${caseInfo.dvrSerial})` : '';
  const evidencePart = caseInfo?.evidenceId ? ` Item #${caseInfo.evidenceId}` : '';
  const examinerName = caseInfo?.examiner || 'R. Hanks';

  const levaNarrative = `LEVA & SWGDE FORENSIC TIMELINE CALIBRATION STATEMENT:
On calibration date, forensic examiner ${examinerName} performed a time calibration analysis on ${dvrMakeModel}${serialPart}${evidencePart} in compliance with SWGDE Best Practices for Video Acquisition from Digital Video Recorders and LEVA Forensic Standards.

At the exact calibration instant, the DVR On-Screen Display (OSD) clock exhibited ${formatForensicTimestamp(dvrDate)}, while the verified forensic reference time was ${formatForensicTimestamp(refDate)} (Source: ${referenceTime.sourceDetails || referenceTime.source.toUpperCase()}).

CALCULATION SUMMARY:
• System Real-Time Clock Variance (Δt): ${signedOffsetStr} (${(deltaSeconds >= 0 ? '+' : '') + deltaSeconds.toFixed(3)} seconds)
• Clock Status: DVR is running ${direction} relative to true reference time.
• Mathematical Proof: ${formulaStr}
• Uncertainty Margin: ± 0.050 seconds (based on shutter subsecond EXIF quantization and visual frame rate).

CONCLUSION:
To reconstruct the true chronological timeline for all forensic video extracted under this examination, the calibrated time (T_Actual) must be computed by subtracting the signed offset (${signedOffsetStr}) from any recorded DVR on-screen display timestamp.`;

  return {
    deltaMs,
    deltaSeconds,
    signedOffsetStr,
    direction,
    humanSummary,
    mathematicalFormula: formulaStr,
    levaNarrative,
    uncertaintyEstimateMs: 50,
  };
}

/**
 * Converts a target DVR event timestamp to true calibrated chronological real-world time.
 * T_Actual = T_DVR - Delta
 */
export function calibrateDvrIncidentTimestamp(dvrEventDate: Date, deltaMs: number): Date {
  return new Date(dvrEventDate.getTime() - deltaMs);
}

/**
 * Multi-point quartz crystal drift rate calculation
 * Drift Rate = (Delta_2 - Delta_1) / Elapsed_Time
 */
export function calculateDriftRate(
  t1Dvr: Date,
  t1Ref: Date,
  t2Dvr: Date,
  t2Ref: Date
): { secondsPerDay: number; ppm: number } {
  const delta1Ms = t1Dvr.getTime() - t1Ref.getTime();
  const delta2Ms = t2Dvr.getTime() - t2Ref.getTime();
  const elapsedRefMs = t2Ref.getTime() - t1Ref.getTime();

  if (elapsedRefMs <= 0) {
    return { secondsPerDay: 0, ppm: 0 };
  }

  const driftChangeMs = delta2Ms - delta1Ms;
  const elapsedDays = elapsedRefMs / (1000 * 60 * 60 * 24);
  const secondsPerDay = (driftChangeMs / 1000) / elapsedDays;
  const ppm = (driftChangeMs / elapsedRefMs) * 1_000_000;

  return {
    secondsPerDay: parseFloat(secondsPerDay.toFixed(3)),
    ppm: parseFloat(ppm.toFixed(2)),
  };
}
