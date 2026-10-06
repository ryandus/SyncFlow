import { describe, expect, it } from 'vitest';
import {
  calculateClockDrift,
  calculateDriftRate,
  calibrateDvrIncidentTimestamp,
  formatForensicTimestamp,
} from './calibrationMath';
import { formatFileSize } from './crypto';

// Local-time records; all dates sit in one DST regime so TZ does not affect deltas.
const rec = (d: number, h: number, mi: number, s: number, ms = 0): any => ({
  year: 2026, month: 10, day: d, hour: h, minute: mi, second: s, millisecond: ms,
  source: 'ntp', sourceDetails: 'test reference',
});

describe('calculateClockDrift', () => {
  it('FAST: DVR 5 s ahead', () => {
    const r = calculateClockDrift(rec(5, 12, 0, 5), rec(5, 12, 0, 0));
    expect(r.deltaMs).toBe(5000);
    expect(r.deltaSeconds).toBe(5);
    expect(r.direction).toBe('FAST');
    expect(r.signedOffsetStr).toBe('+00:00:00:05:000');
  });

  it('SLOW: DVR 1 min 59.750 s behind', () => {
    const r = calculateClockDrift(rec(5, 11, 58, 0, 250), rec(5, 12, 0, 0));
    expect(r.deltaMs).toBe(-119750);
    expect(r.direction).toBe('SLOW');
    expect(r.signedOffsetStr).toBe('-00:00:01:59:750');
    expect([r.minutes, r.seconds, r.milliseconds]).toEqual([1, 59, 750]);
  });

  it('day rollover: 2 d 1 h 29 m 44.500 s', () => {
    const r = calculateClockDrift(rec(7, 12, 0, 0), rec(5, 10, 30, 15, 500));
    expect(r.signedOffsetStr).toBe('+02:01:29:44:500');
    expect([r.days, r.hours, r.minutes, r.seconds, r.milliseconds]).toEqual([2, 1, 29, 44, 500]);
  });

  it('synchronized threshold is +/-20 ms inclusive', () => {
    const at = (ms: number) => calculateClockDrift(rec(5, 12, 0, 0, ms), rec(5, 12, 0, 0)).direction;
    expect(at(20)).toBe('SYNCHRONIZED');
    expect(at(21)).toBe('FAST');
    const behind = (ms: number) => calculateClockDrift(rec(5, 12, 0, 0), rec(5, 12, 0, 0, ms)).direction;
    expect(behind(20)).toBe('SYNCHRONIZED');
    expect(behind(21)).toBe('SLOW');
  });
});

describe('calibrateDvrIncidentTimestamp', () => {
  it('subtracts the signed offset (T_Actual = T_DVR - delta)', () => {
    const event = new Date(2026, 9, 5, 12, 10, 0);
    expect(calibrateDvrIncidentTimestamp(event, 5000)).toEqual(new Date(2026, 9, 5, 12, 9, 55));
    expect(calibrateDvrIncidentTimestamp(event, -5000)).toEqual(new Date(2026, 9, 5, 12, 10, 5));
  });
});

describe('calculateDriftRate', () => {
  it('20 s gained over 10 days = 2 s/day, 23.15 ppm', () => {
    const t1 = new Date(2026, 9, 1);
    const t2 = new Date(2026, 9, 11);
    const r = calculateDriftRate(t1, t1, new Date(t2.getTime() + 20000), t2);
    expect(r).toEqual({ secondsPerDay: 2, ppm: 23.15 });
  });

  it('non-positive elapsed time returns zeros', () => {
    const t = new Date(2026, 9, 1);
    expect(calculateDriftRate(t, t, t, t)).toEqual({ secondsPerDay: 0, ppm: 0 });
  });
});

describe('formatting', () => {
  it('formatForensicTimestamp pads every field', () => {
    expect(formatForensicTimestamp(new Date(2026, 9, 5, 1, 2, 3, 4))).toBe('2026-10-05 01:02:03.004');
  });

  it('formatFileSize', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});
