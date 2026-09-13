/**
 * SyncFlow: Clock Drift Variance & Results Display
 * Large Digital Readout, LEVA Status, and Multi-Point Quartz Drift Analysis
 * Engineered by R. Hanks
 */

import { DriftCalculationResult } from '../types';
import { calculateDriftRate } from '../utils/calibrationMath';

export class DriftResultsPanel {
  private container: HTMLElement;
  private currentResult: DriftCalculationResult | null = null;
  private multiPointActive = false;

  constructor(containerId: string, initialResult: DriftCalculationResult | null) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.currentResult = initialResult;

    this.render();
    this.bindEvents();
  }

  private render() {
    const res = this.currentResult;
    const isFast = res?.direction === 'FAST';
    const isSlow = res?.direction === 'SLOW';

    let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
    let badgeText = 'AWAITING CALIBRATION';
    let ledColor = 'text-slate-400';

    if (isFast) {
      badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      badgeText = 'DVR RUNNING FAST (+ AHEAD OF REAL TIME)';
      ledColor = 'text-amber-400';
    } else if (isSlow) {
      badgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      badgeText = 'DVR RUNNING SLOW (- BEHIND REAL TIME)';
      ledColor = 'text-cyan-400';
    } else if (res?.direction === 'SYNCHRONIZED') {
      badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      badgeText = 'SYNCHRONIZED WITH REFERENCE TIME';
      ledColor = 'text-emerald-400';
    }

    this.container.innerHTML = `
      <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
        <!-- Section Header -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span class="text-xs font-mono font-semibold tracking-wider text-teal-400 uppercase">
              Forensic Calibration Results
            </span>
            <h2 class="text-lg sm:text-xl font-bold text-white flex items-center gap-2 mt-0.5">
              DVR Clock Variance &amp; Timeline Delta (Δt)
            </h2>
          </div>
          <div class="px-3 py-1 rounded-full text-xs font-mono font-bold border ${badgeClass}">
            ${badgeText}
          </div>
        </div>

        <!-- Big Digital Clock Drift Display -->
        <div class="bg-slate-950 border border-slate-800/90 rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
          <!-- Subtle forensic grid overlay in background -->
          <div class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>

          <span class="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1 relative z-10">
            Temporal Offset Signed Vector (Δt = T_DVR - T_Ref)
          </span>

          <div id="drift-digital-offset" class="font-digital text-4xl sm:text-6xl font-bold tracking-wider ${ledColor} digital-led my-2 relative z-10">
            ${res ? res.signedOffsetStr : '+00:00:00.000'}
          </div>

          <div class="text-xs sm:text-sm font-mono text-slate-300 max-w-2xl mt-2 relative z-10 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
            ${res ? res.humanSummary : 'Upload or capture a DVR monitor photograph to compute real-time clock variance.'}
          </div>

          <!-- Mathematical Formula Pill -->
          <div class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-teal-300 relative z-10">
            <span class="text-slate-500 font-semibold">LEVA Formula:</span>
            <span>${res ? res.mathematicalFormula : 'T_Actual = T_DVR - Δt'}</span>
          </div>
        </div>

        <!-- Multi-Point Drift Rate Analysis Drawer (Secondary Check) -->
        <div class="border border-slate-800 rounded-xl p-4 bg-slate-900/50 flex flex-col gap-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span class="text-xs font-mono font-semibold text-slate-200">
                Quartz Crystal Drift Rate (Multi-Point Linear Analysis)
              </span>
              <p class="text-[11px] text-slate-400">
                Compare two calibration checkpoints over elapsed time to determine quartz oscillator drift (sec/day, ppm).
              </p>
            </div>
            <button id="btn-toggle-multipoint" class="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-teal-300 transition">
              ${this.multiPointActive ? 'Close Drift Rate' : 'Calculate Drift Rate (sec/day)'}
            </button>
          </div>

          <div id="multipoint-panel" class="${this.multiPointActive ? 'flex' : 'hidden'} flex-col gap-3 border-t border-slate-800 pt-3">
            <p class="text-xs text-slate-400 font-mono">
              Point 1 is populated from current calibration. Enter second checkpoint (T2) taken at conclusion of scene acquisition:
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div class="flex flex-col gap-1 bg-slate-950 p-2.5 rounded border border-slate-800">
                <span class="text-slate-400 font-semibold">T2 DVR Displayed Time:</span>
                <input type="datetime-local" id="t2-dvr-time" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-teal-400" />
              </div>
              <div class="flex flex-col gap-1 bg-slate-950 p-2.5 rounded border border-slate-800">
                <span class="text-slate-400 font-semibold">T2 Reference Time:</span>
                <input type="datetime-local" id="t2-ref-time" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-teal-400" />
              </div>
            </div>

            <button id="btn-calc-drift-rate" class="w-fit px-4 py-2 rounded bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs font-mono transition">
              Compute Oscillator Drift Rate
            </button>

            <div id="drift-rate-result" class="hidden p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
              <div>
                <span class="text-slate-400">Drift Velocity:</span>
                <span id="rate-sec-day" class="text-teal-400 font-bold ml-1">0.000 sec / 24 hours</span>
              </div>
              <div>
                <span class="text-slate-400">Hardware Stability:</span>
                <span id="rate-ppm" class="text-slate-200 ml-1">0.00 PPM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents() {
    this.container.querySelector('#btn-toggle-multipoint')?.addEventListener('click', () => {
      this.multiPointActive = !this.multiPointActive;
      const panel = this.container.querySelector('#multipoint-panel');
      const btn = this.container.querySelector('#btn-toggle-multipoint');
      if (panel && btn) {
        if (this.multiPointActive) {
          panel.classList.remove('hidden');
          panel.classList.add('flex');
          btn.textContent = 'Close Drift Rate';
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('flex');
          btn.textContent = 'Calculate Drift Rate (sec/day)';
        }
      }
    });

    this.container.querySelector('#btn-calc-drift-rate')?.addEventListener('click', () => {
      this.handleCalcDriftRate();
    });
  }

  private handleCalcDriftRate() {
    const t2DvrInp = this.container.querySelector('#t2-dvr-time') as HTMLInputElement;
    const t2RefInp = this.container.querySelector('#t2-ref-time') as HTMLInputElement;

    if (!t2DvrInp.value || !t2RefInp.value) {
      alert('Please select both T2 DVR time and T2 Reference time to calculate drift rate.');
      return;
    }

    const t2Dvr = new Date(t2DvrInp.value);
    const t2Ref = new Date(t2RefInp.value);

    // Assume T1 is 24 hours earlier with current delta
    const t1Ref = new Date(t2Ref.getTime() - 24 * 3600 * 1000);
    const t1Dvr = new Date(t1Ref.getTime() + (this.currentResult?.deltaMs || 0));

    const rate = calculateDriftRate(t1Dvr, t1Ref, t2Dvr, t2Ref);

    const resultBox = this.container.querySelector('#drift-rate-result');
    const secDayEl = this.container.querySelector('#rate-sec-day');
    const ppmEl = this.container.querySelector('#rate-ppm');

    if (resultBox && secDayEl && ppmEl) {
      secDayEl.textContent = `${rate.secondsPerDay >= 0 ? '+' : ''}${rate.secondsPerDay.toFixed(3)} sec / 24 hours`;
      ppmEl.textContent = `${rate.ppm.toFixed(2)} PPM (Parts Per Million)`;
      resultBox.classList.remove('hidden');
    }
  }

  public updateResult(res: DriftCalculationResult) {
    this.currentResult = res;
    this.render();
    this.bindEvents();
  }
}
