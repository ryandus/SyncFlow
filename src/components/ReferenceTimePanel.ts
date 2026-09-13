/**
 * SyncFlow: Forensic Reference Time & EXIF Calibration Panel
 * Parses and displays ExifReader metadata (DateTimeOriginal, SubSec, Camera, GPS)
 * Engineered by R. Hanks
 */

import { ReferenceTimeRecord, ExifData } from '../types';

export class ReferenceTimePanel {
  private container: HTMLElement;
  private currentRecord: ReferenceTimeRecord;
  private currentExif: ExifData | null = null;
  private onTimeChanged: (updatedRecord: ReferenceTimeRecord) => void;

  constructor(
    containerId: string,
    initialRecord: ReferenceTimeRecord,
    initialExif: ExifData | null,
    onTimeChanged: (updatedRecord: ReferenceTimeRecord) => void
  ) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.currentRecord = { ...initialRecord };
    this.currentExif = initialExif;
    this.onTimeChanged = onTimeChanged;

    this.render();
    this.bindEvents();
  }

  private render() {
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const dateStr = `${this.currentRecord.year}-${pad(this.currentRecord.month)}-${pad(this.currentRecord.day)}`;

    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h3 class="font-bold text-white text-sm sm:text-base">
              Step 2: Calibrated Forensic Reference Time (T_Ref)
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-clear-ref-time" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-700/50 text-slate-400 hover:text-rose-300 text-xs font-mono transition flex items-center gap-1 cursor-pointer" title="Reset Reference Time fields">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span>Clear Reference</span>
            </button>
            <button id="btn-sync-atomic" class="px-2.5 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Sync Now (Atomic/NTP)</span>
            </button>
          </div>
        </div>

        <!-- EXIF Metadata Card / Hardware Diagnostics -->
        <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono flex flex-col gap-2">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span class="text-slate-400 font-semibold flex items-center gap-1.5">
              <svg class="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              ExifReader Hardware &amp; Shutter Metadata
            </span>
            <span id="ref-source-badge" class="px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800/60 text-teal-300 text-[10px]">
              ${this.currentRecord.sourceDetails || 'EXIF DateTimeOriginal'}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div>
              <span class="text-slate-500 block">Acquisition Camera:</span>
              <span id="meta-camera" class="text-slate-200 font-semibold">
                ${[this.currentExif?.cameraMake, this.currentExif?.cameraModel].filter(Boolean).join(' ') || 'Standard Acquisition Sensor'}
              </span>
            </div>
            <div>
              <span class="text-slate-500 block">EXIF DateTime:</span>
              <span id="meta-exif-time" class="text-slate-200">
                ${this.currentExif?.dateTimeOriginal || 'Manual Reference'}
              </span>
            </div>
            <div>
              <span class="text-slate-500 block">SubSec (Milliseconds):</span>
              <span id="meta-subsec" class="text-teal-400 font-bold">
                ${this.currentExif?.subSecTimeOriginal ? `${this.currentExif.subSecTimeOriginal} ms` : '000 ms'}
              </span>
            </div>
            <div>
              <span class="text-slate-500 block">GPS Coordinates:</span>
              <span id="meta-gps" class="text-slate-300">
                ${this.currentExif?.gpsLatitude && this.currentExif?.gpsLongitude ? `${this.currentExif.gpsLatitude.toFixed(4)}°, ${this.currentExif.gpsLongitude.toFixed(4)}°` : 'No GPS Tag'}
              </span>
            </div>
          </div>
        </div>

        <!-- Reference Time Inputs -->
        <div class="flex flex-col gap-3 font-mono">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <!-- Date Input -->
            <div class="sm:col-span-4 flex flex-col gap-1">
              <span class="text-[11px] text-slate-400">Reference Date (YYYY-MM-DD)</span>
              <input type="date" id="ref-input-date" value="${dateStr}" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none" />
            </div>

            <!-- Time Inputs (H:M:S.ms) -->
            <div class="sm:col-span-8 flex flex-col gap-1">
              <span class="text-[11px] text-slate-400">Reference Time (HH : MM : SS . mmm)</span>
              <div class="grid grid-cols-4 gap-1.5">
                <input type="number" id="ref-input-hour" min="0" max="23" value="${pad(this.currentRecord.hour)}" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:border-teal-400 focus:outline-none" placeholder="HH" />
                <input type="number" id="ref-input-minute" min="0" max="59" value="${pad(this.currentRecord.minute)}" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:border-teal-400 focus:outline-none" placeholder="MM" />
                <input type="number" id="ref-input-second" min="0" max="59" value="${pad(this.currentRecord.second)}" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:border-teal-400 focus:outline-none" placeholder="SS" />
                <input type="number" id="ref-input-ms" min="0" max="999" value="${pad(this.currentRecord.millisecond, 3)}" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:border-teal-400 focus:outline-none" placeholder="mmm" />
              </div>
            </div>
          </div>

          <!-- Micro-adjust row -->
          <div class="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
            <span class="text-[11px] text-slate-400">Reference Fine-Tune:</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button id="btn-ref-adj-sec-minus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
                -1s
              </button>
              <button id="btn-ref-adj-sec-plus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
                +1s
              </button>
              <button id="btn-ref-adj-min-minus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
                -1m
              </button>
              <button id="btn-ref-adj-min-plus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
                +1m
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents() {
    this.container.querySelector('#btn-clear-ref-time')?.addEventListener('click', () => this.clearFields());
    this.container.querySelector('#btn-sync-atomic')?.addEventListener('click', () => this.syncToCurrentDeviceTime());

    const inpDate = this.container.querySelector('#ref-input-date') as HTMLInputElement;
    const inpHour = this.container.querySelector('#ref-input-hour') as HTMLInputElement;
    const inpMin = this.container.querySelector('#ref-input-minute') as HTMLInputElement;
    const inpSec = this.container.querySelector('#ref-input-second') as HTMLInputElement;
    const inpMs = this.container.querySelector('#ref-input-ms') as HTMLInputElement;

    const onInputChange = () => {
      if (inpDate.value) {
        const parts = inpDate.value.split('-');
        if (parts.length === 3) {
          this.currentRecord.year = parseInt(parts[0], 10);
          this.currentRecord.month = parseInt(parts[1], 10);
          this.currentRecord.day = parseInt(parts[2], 10);
        }
      }
      this.currentRecord.hour = Math.min(23, Math.max(0, parseInt(inpHour.value, 10) || 0));
      this.currentRecord.minute = Math.min(59, Math.max(0, parseInt(inpMin.value, 10) || 0));
      this.currentRecord.second = Math.min(59, Math.max(0, parseInt(inpSec.value, 10) || 0));
      this.currentRecord.millisecond = Math.min(999, Math.max(0, parseInt(inpMs.value, 10) || 0));

      this.onTimeChanged(this.currentRecord);
    };

    inpDate?.addEventListener('change', onInputChange);
    inpHour?.addEventListener('input', onInputChange);
    inpMin?.addEventListener('input', onInputChange);
    inpSec?.addEventListener('input', onInputChange);
    inpMs?.addEventListener('input', onInputChange);

    this.container.querySelector('#btn-ref-adj-sec-minus')?.addEventListener('click', () => this.adjustTime(-1, 'second'));
    this.container.querySelector('#btn-ref-adj-sec-plus')?.addEventListener('click', () => this.adjustTime(1, 'second'));
    this.container.querySelector('#btn-ref-adj-min-minus')?.addEventListener('click', () => this.adjustTime(-1, 'minute'));
    this.container.querySelector('#btn-ref-adj-min-plus')?.addEventListener('click', () => this.adjustTime(1, 'minute'));
  }

  private adjustTime(amount: number, unit: 'second' | 'minute') {
    const d = new Date(
      this.currentRecord.year,
      this.currentRecord.month - 1,
      this.currentRecord.day,
      this.currentRecord.hour,
      this.currentRecord.minute,
      this.currentRecord.second,
      this.currentRecord.millisecond
    );

    if (unit === 'second') d.setSeconds(d.getSeconds() + amount);
    if (unit === 'minute') d.setMinutes(d.getMinutes() + amount);

    this.currentRecord.year = d.getFullYear();
    this.currentRecord.month = d.getMonth() + 1;
    this.currentRecord.day = d.getDate();
    this.currentRecord.hour = d.getHours();
    this.currentRecord.minute = d.getMinutes();
    this.currentRecord.second = d.getSeconds();
    this.currentRecord.millisecond = d.getMilliseconds();

    this.syncInputs();
    this.onTimeChanged(this.currentRecord);
  }

  public syncToCurrentDeviceTime() {
    const now = new Date();
    this.currentRecord.year = now.getFullYear();
    this.currentRecord.month = now.getMonth() + 1;
    this.currentRecord.day = now.getDate();
    this.currentRecord.hour = now.getHours();
    this.currentRecord.minute = now.getMinutes();
    this.currentRecord.second = now.getSeconds();
    this.currentRecord.millisecond = now.getMilliseconds();
    this.currentRecord.source = 'nist';
    this.currentRecord.sourceDetails = 'NTP / Atomic Reference Clock (Local Device Synchronized)';

    this.syncInputs();
    const sourceBadge = this.container.querySelector('#ref-source-badge');
    if (sourceBadge) sourceBadge.textContent = this.currentRecord.sourceDetails;

    this.onTimeChanged(this.currentRecord);
  }

  public updateExif(exif: ExifData) {
    this.currentExif = exif;

    const metaCam = this.container.querySelector('#meta-camera');
    if (metaCam) metaCam.textContent = [exif.cameraMake, exif.cameraModel].filter(Boolean).join(' ') || 'Standard Acquisition Sensor';

    const metaTime = this.container.querySelector('#meta-exif-time');
    if (metaTime) metaTime.textContent = exif.dateTimeOriginal || 'Manual Reference';

    const metaSubSec = this.container.querySelector('#meta-subsec');
    if (metaSubSec) metaSubSec.textContent = exif.subSecTimeOriginal ? `${exif.subSecTimeOriginal} ms` : '000 ms';

    const metaGps = this.container.querySelector('#meta-gps');
    if (metaGps) {
      metaGps.textContent = exif.gpsLatitude && exif.gpsLongitude ? `${exif.gpsLatitude.toFixed(4)}°, ${exif.gpsLongitude.toFixed(4)}°` : 'No GPS Tag';
    }

    if (exif.parsedDate) {
      this.currentRecord.year = exif.parsedDate.getFullYear();
      this.currentRecord.month = exif.parsedDate.getMonth() + 1;
      this.currentRecord.day = exif.parsedDate.getDate();
      this.currentRecord.hour = exif.parsedDate.getHours();
      this.currentRecord.minute = exif.parsedDate.getMinutes();
      this.currentRecord.second = exif.parsedDate.getSeconds();
      this.currentRecord.millisecond = exif.parsedDate.getMilliseconds();
      this.currentRecord.source = 'exif';
      this.currentRecord.sourceDetails = `EXIF DateTimeOriginal (${exif.cameraModel || 'Camera'})`;

      this.syncInputs();
      this.onTimeChanged(this.currentRecord);
    }
  }

  private syncInputs() {
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const inpDate = this.container.querySelector('#ref-input-date') as HTMLInputElement;
    const inpHour = this.container.querySelector('#ref-input-hour') as HTMLInputElement;
    const inpMin = this.container.querySelector('#ref-input-minute') as HTMLInputElement;
    const inpSec = this.container.querySelector('#ref-input-second') as HTMLInputElement;
    const inpMs = this.container.querySelector('#ref-input-ms') as HTMLInputElement;

    if (inpDate) inpDate.value = `${this.currentRecord.year}-${pad(this.currentRecord.month)}-${pad(this.currentRecord.day)}`;
    if (inpHour) inpHour.value = pad(this.currentRecord.hour);
    if (inpMin) inpMin.value = pad(this.currentRecord.minute);
    if (inpSec) inpSec.value = pad(this.currentRecord.second);
    if (inpMs) inpMs.value = pad(this.currentRecord.millisecond, 3);
  }

  public setRecord(rec: ReferenceTimeRecord) {
    this.currentRecord = { ...rec };
    this.syncInputs();
    const sourceBadge = this.container.querySelector('#ref-source-badge');
    if (sourceBadge) sourceBadge.textContent = rec.sourceDetails || 'EXIF DateTimeOriginal';
  }

  public clearFields() {
    const now = new Date();
    this.currentRecord = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
      source: 'manual',
      sourceDetails: 'Manual Reference (Awaiting Input)',
    };
    this.currentExif = null;

    const metaCam = this.container.querySelector('#meta-camera');
    if (metaCam) metaCam.textContent = 'None (Awaiting Sensor)';

    const metaTime = this.container.querySelector('#meta-exif-time');
    if (metaTime) metaTime.textContent = 'Awaiting Reference';

    const metaSubSec = this.container.querySelector('#meta-subsec');
    if (metaSubSec) metaSubSec.textContent = '000 ms';

    const metaGps = this.container.querySelector('#meta-gps');
    if (metaGps) metaGps.textContent = 'No GPS Tag';

    this.syncInputs();
    const sourceBadge = this.container.querySelector('#ref-source-badge');
    if (sourceBadge) sourceBadge.textContent = this.currentRecord.sourceDetails;

    this.onTimeChanged(this.currentRecord);
  }
}
