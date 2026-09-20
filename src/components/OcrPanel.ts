/**
 * SyncFlow: Forensic OCR & Time Verification Panel
 * Runs Tesseract.js OCR and provides micro-adjust verification controls
 * Engineered by R. Hanks
 */

import { DVRTimeRecord } from '../types';
import { performOcr } from '../utils/ocrEngine';

export class OcrVerificationPanel {
  private container: HTMLElement;
  private currentRecord: DVRTimeRecord;
  private getPreprocessedCanvas: () => HTMLCanvasElement | null;
  private onTimeChanged: (updatedRecord: DVRTimeRecord) => void;

  constructor(
    containerId: string,
    initialRecord: DVRTimeRecord,
    getPreprocessedCanvas: () => HTMLCanvasElement | null,
    onTimeChanged: (updatedRecord: DVRTimeRecord) => void
  ) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.currentRecord = { ...initialRecord };
    this.getPreprocessedCanvas = getPreprocessedCanvas;
    this.onTimeChanged = onTimeChanged;

    this.render();
    this.bindEvents();
  }

  private render() {
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const dateStr = `${this.currentRecord.year}-${pad(this.currentRecord.month)}-${pad(this.currentRecord.day)}`;

    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
        <!-- Panel Header -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
              <h3 class="font-bold text-white text-sm sm:text-base">
                Step 1: Extract &amp; Verify DVR On-Screen Display Time
              </h3>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Extract the on-screen display timestamp from the cropped DVR frame using local OCR, then verify or adjust each field to match the monitor display.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-clear-dvr-time" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-700/50 text-slate-400 hover:text-rose-300 text-xs font-mono transition flex items-center gap-1 cursor-pointer" title="Reset DVR time fields">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span>Clear DVR Clock</span>
            </button>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
              Tesseract.js Client OCR
            </span>
          </div>
        </div>

        <!-- Action: Run OCR Button & Progress -->
        <div class="flex flex-col gap-2">
          <div class="flex flex-col sm:flex-row gap-3">
            <button id="btn-run-ocr" class="flex-1 py-3 px-4 rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-[0.99] text-slate-950 font-bold text-sm tracking-wide shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition cursor-pointer">
              <svg id="ocr-icon-scan" class="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
              </svg>
              <svg id="ocr-icon-spinner" class="w-5 h-5 text-slate-950 animate-spin hidden" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span id="ocr-btn-text">EXTRACT CLOCK VIA OCR</span>
            </button>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">
            Scans the preprocessed ROI buffer in your browser with zero external network transmission.
          </span>

          <!-- Progress Bar (hidden unless active) -->
          <div id="ocr-progress-container" class="hidden flex-col gap-1.5 pt-1">
            <div class="flex justify-between text-xs font-mono text-slate-400">
              <span id="ocr-status-text">Initializing OCR Engine...</span>
              <span id="ocr-percentage-text">0%</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div id="ocr-progress-bar" class="bg-teal-400 h-full w-0 transition-all duration-200"></div>
            </div>
          </div>
        </div>

        <!-- OCR Raw Result & Confidence Readout -->
        <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
          <div class="flex items-center gap-2">
            <span class="text-slate-400">Raw OCR Readout:</span>
            <span id="ocr-raw-text" class="text-teal-300 font-semibold px-2 py-0.5 bg-teal-950/60 border border-teal-800/60 rounded">
              ${this.currentRecord.rawOcrText || 'Awaiting OCR scan...'}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-400">Confidence:</span>
            <span id="ocr-confidence-badge" class="px-2 py-0.5 rounded font-bold ${
              this.currentRecord.ocrConfidence > 80
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }">
              ${this.currentRecord.ocrConfidence ? this.currentRecord.ocrConfidence + '%' : '--'}
            </span>
          </div>
        </div>

        <!-- Verified DVR Displayed Time Input Form -->
        <div class="border-t border-slate-800 pt-3 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-xs font-mono font-semibold text-slate-200 flex items-center gap-1.5">
                <span>Verified DVR Clock (On-Screen Display Timestamp)</span>
              </label>
              <p class="text-[10px] text-slate-400">
                Enter the exact timestamp displayed on the DVR monitor when the reference photograph was taken.
              </p>
            </div>
            <span class="text-[11px] font-mono text-slate-400 hidden sm:inline">LEVA Section 4.2 Standard</span>
          </div>

          <!-- Date & Time Input Row -->
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 font-mono">
            <!-- Date Input -->
            <div class="sm:col-span-4 flex flex-col gap-1">
              <span class="text-[11px] text-slate-400 font-medium">Date (YYYY-MM-DD)</span>
              <input type="date" id="dvr-input-date" value="${dateStr}" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none" />
              <span class="text-[9px] text-slate-500">Date displayed on the DVR monitor</span>
            </div>

            <!-- Time Inputs (H:M:S.ms) -->
            <div class="sm:col-span-8 flex flex-col gap-1">
              <span class="text-[11px] text-slate-400 font-medium">Time (HH : MM : SS . mmm)</span>
              <div class="grid grid-cols-4 gap-1.5">
                <input type="number" id="dvr-input-hour" min="0" max="23" value="${pad(this.currentRecord.hour)}" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:border-teal-400 focus:outline-none" placeholder="HH" title="DVR Hours (0-23)" />
                <input type="number" id="dvr-input-minute" min="0" max="59" value="${pad(this.currentRecord.minute)}" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:border-teal-400 focus:outline-none" placeholder="MM" title="DVR Minutes (0-59)" />
                <input type="number" id="dvr-input-second" min="0" max="59" value="${pad(this.currentRecord.second)}" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:border-teal-400 focus:outline-none" placeholder="SS" title="DVR Seconds (0-59)" />
                <input type="number" id="dvr-input-ms" min="0" max="999" value="${pad(this.currentRecord.millisecond, 3)}" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:border-teal-400 focus:outline-none" placeholder="mmm" title="DVR Milliseconds (0-999)" />
              </div>
              <span class="text-[9px] text-slate-500">Hours (00-23), Minutes (00-59), Seconds (00-59), Milliseconds (000-999)</span>
            </div>
          </div>

          <!-- Micro-Adjust Buttons for Forensic Fine-Tuning -->
          <div class="flex items-center justify-between flex-wrap gap-2 pt-1 font-mono text-xs">
            <span class="text-[11px] text-slate-400" title="Fine-tune time if OCR misread seconds by ±1">Micro-Adjust DVR Time:</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button id="btn-adj-sec-minus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer" title="Subtract 1 Second">
                -1s
              </button>
              <button id="btn-adj-sec-plus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition" title="Plus 1 Second">
                +1s
              </button>
              <button id="btn-adj-min-minus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition" title="Minus 1 Minute">
                -1m
              </button>
              <button id="btn-adj-min-plus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition" title="Plus 1 Minute">
                +1m
              </button>
              <button id="btn-adj-hr-minus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition" title="Minus 1 Hour (DST offset)">
                -1h
              </button>
              <button id="btn-adj-hr-plus" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition" title="Plus 1 Hour (DST offset)">
                +1h
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents() {
    // Clear DVR Time button
    this.container.querySelector('#btn-clear-dvr-time')?.addEventListener('click', () => this.clearFields());

    // Run OCR button
    this.container.querySelector('#btn-run-ocr')?.addEventListener('click', () => this.handleRunOcr());

    // Input changes
    const inpDate = this.container.querySelector('#dvr-input-date') as HTMLInputElement;
    const inpHour = this.container.querySelector('#dvr-input-hour') as HTMLInputElement;
    const inpMin = this.container.querySelector('#dvr-input-minute') as HTMLInputElement;
    const inpSec = this.container.querySelector('#dvr-input-second') as HTMLInputElement;
    const inpMs = this.container.querySelector('#dvr-input-ms') as HTMLInputElement;

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
      this.currentRecord.isVerified = true;

      this.onTimeChanged(this.currentRecord);
    };

    inpDate?.addEventListener('change', onInputChange);
    inpHour?.addEventListener('input', onInputChange);
    inpMin?.addEventListener('input', onInputChange);
    inpSec?.addEventListener('input', onInputChange);
    inpMs?.addEventListener('input', onInputChange);

    // Micro-adjust buttons
    this.container.querySelector('#btn-adj-sec-minus')?.addEventListener('click', () => this.adjustTime(-1, 'second'));
    this.container.querySelector('#btn-adj-sec-plus')?.addEventListener('click', () => this.adjustTime(1, 'second'));
    this.container.querySelector('#btn-adj-min-minus')?.addEventListener('click', () => this.adjustTime(-1, 'minute'));
    this.container.querySelector('#btn-adj-min-plus')?.addEventListener('click', () => this.adjustTime(1, 'minute'));
    this.container.querySelector('#btn-adj-hr-minus')?.addEventListener('click', () => this.adjustTime(-1, 'hour'));
    this.container.querySelector('#btn-adj-hr-plus')?.addEventListener('click', () => this.adjustTime(1, 'hour'));
  }

  private adjustTime(amount: number, unit: 'second' | 'minute' | 'hour') {
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
    if (unit === 'hour') d.setHours(d.getHours() + amount);

    this.currentRecord.year = d.getFullYear();
    this.currentRecord.month = d.getMonth() + 1;
    this.currentRecord.day = d.getDate();
    this.currentRecord.hour = d.getHours();
    this.currentRecord.minute = d.getMinutes();
    this.currentRecord.second = d.getSeconds();
    this.currentRecord.millisecond = d.getMilliseconds();
    this.currentRecord.isVerified = true;

    this.syncInputs();
    this.onTimeChanged(this.currentRecord);
  }

  private syncInputs() {
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const inpDate = this.container.querySelector('#dvr-input-date') as HTMLInputElement;
    const inpHour = this.container.querySelector('#dvr-input-hour') as HTMLInputElement;
    const inpMin = this.container.querySelector('#dvr-input-minute') as HTMLInputElement;
    const inpSec = this.container.querySelector('#dvr-input-second') as HTMLInputElement;
    const inpMs = this.container.querySelector('#dvr-input-ms') as HTMLInputElement;

    if (inpDate) inpDate.value = `${this.currentRecord.year}-${pad(this.currentRecord.month)}-${pad(this.currentRecord.day)}`;
    if (inpHour) inpHour.value = pad(this.currentRecord.hour);
    if (inpMin) inpMin.value = pad(this.currentRecord.minute);
    if (inpSec) inpSec.value = pad(this.currentRecord.second);
    if (inpMs) inpMs.value = pad(this.currentRecord.millisecond, 3);
  }

  private async handleRunOcr() {
    const canvas = this.getPreprocessedCanvas();
    if (!canvas) {
      alert('Please load an image and adjust the crop area over the DVR clock first.');
      return;
    }

    const btn = this.container.querySelector('#btn-run-ocr') as HTMLButtonElement;
    const iconScan = this.container.querySelector('#ocr-icon-scan') as HTMLElement;
    const iconSpinner = this.container.querySelector('#ocr-icon-spinner') as HTMLElement;
    const btnText = this.container.querySelector('#ocr-btn-text') as HTMLElement;
    const progressContainer = this.container.querySelector('#ocr-progress-container') as HTMLElement;
    const progressBar = this.container.querySelector('#ocr-progress-bar') as HTMLElement;
    const statusText = this.container.querySelector('#ocr-status-text') as HTMLElement;
    const pctText = this.container.querySelector('#ocr-percentage-text') as HTMLElement;

    try {
      btn.disabled = true;
      iconScan.classList.add('hidden');
      iconSpinner.classList.remove('hidden');
      btnText.textContent = 'ANALYZING DVR CLOCK...';
      progressContainer.classList.remove('hidden');
      progressContainer.classList.add('flex');

      const result = await performOcr(canvas, (pct, status) => {
        progressBar.style.width = `${pct}%`;
        pctText.textContent = `${pct}%`;
        statusText.textContent = status;
      });

      // Update current record
      this.currentRecord.rawOcrText = result.text;
      this.currentRecord.ocrConfidence = result.confidence;

      if (result.parsedTime.hour !== undefined) {
        this.currentRecord.hour = result.parsedTime.hour;
        this.currentRecord.minute = result.parsedTime.minute || 0;
        this.currentRecord.second = result.parsedTime.second || 0;
        this.currentRecord.millisecond = result.parsedTime.millisecond || 0;
      }
      if (result.parsedTime.year !== undefined) {
        this.currentRecord.year = result.parsedTime.year;
        this.currentRecord.month = result.parsedTime.month || this.currentRecord.month;
        this.currentRecord.day = result.parsedTime.day || this.currentRecord.day;
      }

      this.currentRecord.isVerified = true;

      // Update UI displays
      const rawTextEl = this.container.querySelector('#ocr-raw-text');
      if (rawTextEl) rawTextEl.textContent = result.text || '(No text detected)';

      const badge = this.container.querySelector('#ocr-confidence-badge');
      if (badge) {
        badge.textContent = `${result.confidence}%`;
        badge.className = `px-2 py-0.5 rounded font-bold ${
          result.confidence > 80
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        }`;
      }

      this.syncInputs();
      this.onTimeChanged(this.currentRecord);

    } catch (err: any) {
      console.warn('OCR error:', err);
      statusText.textContent = 'OCR Notice: Enter DVR time manually below or adjust preprocessing.';
    } finally {
      btn.disabled = false;
      iconScan.classList.remove('hidden');
      iconSpinner.classList.add('hidden');
      btnText.textContent = 'EXTRACT CLOCK VIA OCR';
      setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressContainer.classList.remove('flex');
      }, 1500);
    }
  }

  public setRecord(rec: DVRTimeRecord) {
    this.currentRecord = { ...rec };
    this.syncInputs();

    const rawTextEl = this.container.querySelector('#ocr-raw-text');
    if (rawTextEl) rawTextEl.textContent = rec.rawOcrText || '(Demo Pre-loaded)';

    const badge = this.container.querySelector('#ocr-confidence-badge');
    if (badge) badge.textContent = `${rec.ocrConfidence}%`;
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
      ocrConfidence: 0,
      rawOcrText: '',
      isVerified: false,
    };
    this.syncInputs();

    const rawTextEl = this.container.querySelector('#ocr-raw-text');
    if (rawTextEl) rawTextEl.textContent = '(Cleared — Awaiting OCR or Manual Entry)';

    const badge = this.container.querySelector('#ocr-confidence-badge');
    if (badge) {
      badge.textContent = '--';
      badge.className = 'px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400 border border-slate-700';
    }

    this.onTimeChanged(this.currentRecord);
  }
}
