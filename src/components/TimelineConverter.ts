/**
 * SyncFlow: Incident Timeline Calibrator & Milestone Log
 * Converts footage timestamps into true real-world chronology
 * Engineered by R. Hanks
 */

import { IncidentMilestone, DriftCalculationResult } from '../types';
import { calibrateDvrIncidentTimestamp, formatForensicTimestamp } from '../utils/calibrationMath';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class TimelineConverter {
  private container: HTMLElement;
  private currentResult: DriftCalculationResult | null = null;
  private onMilestonesChange?: (milestones: IncidentMilestone[]) => void;

  // Initialize with empty milestone rows using standard placeholders
  private milestones: IncidentMilestone[] = [
    {
      id: 'm-1',
      label: '',
      dvrTimestamp: '',
      calibratedTimestamp: '',
      notes: '',
    },
    {
      id: 'm-2',
      label: '',
      dvrTimestamp: '',
      calibratedTimestamp: '',
      notes: '',
    },
    {
      id: 'm-3',
      label: '',
      dvrTimestamp: '',
      calibratedTimestamp: '',
      notes: '',
    },
  ];

  constructor(
    containerId: string,
    initialResult: DriftCalculationResult | null,
    onMilestonesChange?: (milestones: IncidentMilestone[]) => void
  ) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.currentResult = initialResult;
    this.onMilestonesChange = onMilestonesChange;

    this.recalcMilestones();
    this.render();
    this.bindEvents();
  }

  private recalcMilestones() {
    const deltaMs = this.currentResult?.deltaMs || 0;
    this.milestones.forEach(m => {
      const ts = m.dvrTimestamp.trim();
      if (!ts) {
        m.calibratedTimestamp = '';
        return;
      }
      try {
        const dvrDate = new Date(ts.replace(' ', 'T'));
        if (!isNaN(dvrDate.getTime())) {
          const calDate = calibrateDvrIncidentTimestamp(dvrDate, deltaMs);
          m.calibratedTimestamp = formatForensicTimestamp(calDate);
        } else {
          m.calibratedTimestamp = 'Invalid DVR format';
        }
      } catch {
        m.calibratedTimestamp = 'Parse error';
      }
    });
  }

  private render() {
    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
              <h3 class="font-bold text-white text-sm sm:text-base">
                Step 3: Incident Timeline Synchronizer &amp; Milestone Logger
              </h3>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Calibrate observed video event timestamps into true chronological time for evidence logs and courtroom presentations.
            </p>
          </div>
          <span class="text-xs font-mono text-slate-400 hidden sm:inline">
            Real-Time T_Actual = T_DVR - Δt
          </span>
        </div>

        <!-- Quick Instant Timestamp Converter Bar -->
        <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div class="flex-1 flex flex-col gap-1">
              <label for="calc-input-dvr" class="text-[11px] font-mono text-slate-300 font-medium">Enter DVR Event Timestamp (From Video Footage):</label>
              <input type="text" id="calc-input-dvr" placeholder="YYYY-MM-DD HH:MM:SS" value="" class="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-400" />
              <span class="text-[9px] text-slate-500 font-mono">Format: YYYY-MM-DD HH:MM:SS (e.g. 2026-10-14 19:40:00)</span>
            </div>

            <div class="hidden sm:flex items-center text-teal-400 pt-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </div>

            <div class="flex-1 flex flex-col gap-1">
              <label class="text-[11px] font-mono text-slate-300 font-medium">Calibrated True Chronological Time:</label>
              <div id="calc-output-real" class="bg-teal-950/40 border border-teal-800/60 rounded px-3 py-2 text-xs font-mono text-teal-300 font-bold min-h-[34px] flex items-center">
                <span class="text-slate-500 font-normal">Awaiting DVR timestamp...</span>
              </div>
              <span class="text-[9px] text-slate-500 font-mono">True real-world time with Δt offset mathematically applied</span>
            </div>
          </div>
        </div>

        <!-- Milestone Table -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span class="text-xs font-mono font-semibold text-slate-300">
                Synchronized Event Timeline (Court Exhibit Table)
              </span>
              <p class="text-[10px] text-slate-400">
                Log critical incident events (suspect arrival, breach, exit). Calibrated times synchronize automatically.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-clear-milestones" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-700/50 text-slate-400 hover:text-rose-300 text-xs font-mono transition flex items-center gap-1 cursor-pointer" title="Reset all milestone rows to empty placeholders">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                <span>Clear Milestones</span>
              </button>
              <button id="btn-add-milestone" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-400 text-xs font-mono transition flex items-center gap-1 cursor-pointer" title="Add a new milestone row">
                <span>+ Add Incident Mark</span>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto rounded-lg border border-slate-800">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th class="p-2.5 font-semibold w-1/2">Incident Milestone / Description</th>
                  <th class="p-2.5 font-semibold w-1/4">Recorded DVR OSD</th>
                  <th class="p-2.5 font-semibold text-teal-300 w-1/4">Calibrated True Real Time</th>
                  <th class="p-2.5 font-semibold text-right w-12">Action</th>
                </tr>
              </thead>
              <tbody id="milestone-table-body" class="divide-y divide-slate-800/80 bg-slate-900/60">
                ${this.renderMilestoneRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  private renderMilestoneRows(): string {
    if (this.milestones.length === 0) {
      return `
        <tr>
          <td colspan="4" class="p-6 text-center text-slate-500 font-mono text-xs">
            No incident milestones logged. Click "+ Add Incident Mark" to insert an event row.
          </td>
        </tr>
      `;
    }

    return this.milestones
      .map(
        m => `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="p-2.5">
            <input 
              type="text" 
              data-id="${m.id}" 
              data-field="label" 
              placeholder="e.g., Suspect enters yard from cut fence at xxxx hours" 
              value="${escapeHtml(m.label)}" 
              class="milestone-input-label w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-400 font-sans" 
            />
          </td>
          <td class="p-2.5">
            <input 
              type="text" 
              data-id="${m.id}" 
              data-field="dvrTimestamp" 
              placeholder="YYYY-MM-DD HH:MM:SS" 
              value="${escapeHtml(m.dvrTimestamp)}" 
              class="milestone-input-dvr w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-400" 
            />
          </td>
          <td class="p-2.5">
            <div id="cal-cell-${m.id}" class="px-2.5 py-1.5 rounded-lg bg-teal-950/40 border border-teal-800/60 font-mono text-xs text-teal-300 font-semibold min-h-[30px] flex items-center">
              ${m.calibratedTimestamp ? escapeHtml(m.calibratedTimestamp) : '<span class="text-slate-500 font-normal">Awaiting DVR time</span>'}
            </div>
          </td>
          <td class="p-2.5 text-right">
            <button data-delete-id="${m.id}" class="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-slate-800 cursor-pointer text-xs transition" title="Delete Row">
              ✕
            </button>
          </td>
        </tr>
      `
      )
      .join('');
  }

  private bindEvents() {
    // Quick Instant Timestamp Converter Bar
    const inputEl = this.container.querySelector('#calc-input-dvr') as HTMLInputElement;
    const outputEl = this.container.querySelector('#calc-output-real') as HTMLElement;

    const updateQuickCalc = () => {
      const val = inputEl?.value.trim();
      if (!val) {
        outputEl.innerHTML = '<span class="text-slate-500 font-normal">Awaiting DVR timestamp...</span>';
        return;
      }
      try {
        const d = new Date(val.replace(' ', 'T'));
        if (!isNaN(d.getTime())) {
          const deltaMs = this.currentResult?.deltaMs || 0;
          const trueDate = calibrateDvrIncidentTimestamp(d, deltaMs);
          outputEl.textContent = formatForensicTimestamp(trueDate);
        } else {
          outputEl.textContent = 'Format: YYYY-MM-DD HH:MM:SS';
        }
      } catch {
        outputEl.textContent = 'Invalid format';
      }
    };

    inputEl?.addEventListener('input', updateQuickCalc);

    // Clear milestones button
    this.container.querySelector('#btn-clear-milestones')?.addEventListener('click', () => {
      this.clearMilestones();
    });

    // Add milestone button
    this.container.querySelector('#btn-add-milestone')?.addEventListener('click', () => {
      this.milestones.push({
        id: 'm-' + Date.now(),
        label: '',
        dvrTimestamp: '',
        calibratedTimestamp: '',
        notes: '',
      });
      const tbody = this.container.querySelector('#milestone-table-body');
      if (tbody) tbody.innerHTML = this.renderMilestoneRows();
      this.bindTableActions();
      this.notifyChange();
    });

    this.bindTableActions();
  }

  private bindTableActions() {
    // Input listener for milestone label
    this.container.querySelectorAll('.milestone-input-label').forEach(el => {
      el.addEventListener('input', e => {
        const target = e.target as HTMLInputElement;
        const id = target.getAttribute('data-id');
        const m = this.milestones.find(item => item.id === id);
        if (m) {
          m.label = target.value;
          this.notifyChange();
        }
      });
    });

    // Input listener for DVR timestamp
    this.container.querySelectorAll('.milestone-input-dvr').forEach(el => {
      el.addEventListener('input', e => {
        const target = e.target as HTMLInputElement;
        const id = target.getAttribute('data-id');
        const m = this.milestones.find(item => item.id === id);
        if (m) {
          m.dvrTimestamp = target.value;
          const deltaMs = this.currentResult?.deltaMs || 0;
          const ts = m.dvrTimestamp.trim();
          if (!ts) {
            m.calibratedTimestamp = '';
          } else {
            try {
              const d = new Date(ts.replace(' ', 'T'));
              if (!isNaN(d.getTime())) {
                const trueDate = calibrateDvrIncidentTimestamp(d, deltaMs);
                m.calibratedTimestamp = formatForensicTimestamp(trueDate);
              } else {
                m.calibratedTimestamp = 'Invalid DVR format';
              }
            } catch {
              m.calibratedTimestamp = 'Parse error';
            }
          }

          // Update just the calibrated cell to prevent losing focus
          const cell = this.container.querySelector(`#cal-cell-${id}`);
          if (cell) {
            cell.innerHTML = m.calibratedTimestamp
              ? escapeHtml(m.calibratedTimestamp)
              : '<span class="text-slate-500 font-normal">Awaiting DVR time</span>';
          }
          this.notifyChange();
        }
      });
    });

    // Delete buttons
    this.container.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-delete-id');
        this.milestones = this.milestones.filter(m => m.id !== id);
        const tbody = this.container.querySelector('#milestone-table-body');
        if (tbody) tbody.innerHTML = this.renderMilestoneRows();
        this.bindTableActions();
        this.notifyChange();
      });
    });
  }

  private notifyChange() {
    if (this.onMilestonesChange) {
      this.onMilestonesChange(this.milestones);
    }
  }

  public clearMilestones() {
    // Reset to 3 clean empty milestone rows using the required placeholders
    this.milestones = [
      {
        id: 'm-1',
        label: '',
        dvrTimestamp: '',
        calibratedTimestamp: '',
        notes: '',
      },
      {
        id: 'm-2',
        label: '',
        dvrTimestamp: '',
        calibratedTimestamp: '',
        notes: '',
      },
      {
        id: 'm-3',
        label: '',
        dvrTimestamp: '',
        calibratedTimestamp: '',
        notes: '',
      },
    ];
    const tbody = this.container.querySelector('#milestone-table-body');
    if (tbody) tbody.innerHTML = this.renderMilestoneRows();
    this.bindTableActions();
    this.notifyChange();
  }

  public setMilestones(milestones: IncidentMilestone[]) {
    this.milestones = [...milestones];
    this.recalcMilestones();
    const tbody = this.container.querySelector('#milestone-table-body');
    if (tbody) tbody.innerHTML = this.renderMilestoneRows();
    this.bindTableActions();
    this.notifyChange();
  }

  public updateResult(res: DriftCalculationResult) {
    this.currentResult = res;
    this.recalcMilestones();

    // Update each calibrated cell
    this.milestones.forEach(m => {
      const cell = this.container.querySelector(`#cal-cell-${m.id}`);
      if (cell) {
        cell.innerHTML = m.calibratedTimestamp
          ? escapeHtml(m.calibratedTimestamp)
          : '<span class="text-slate-500 font-normal">Awaiting DVR time</span>';
      }
    });

    const inputEl = this.container.querySelector('#calc-input-dvr') as HTMLInputElement;
    const outputEl = this.container.querySelector('#calc-output-real') as HTMLElement;
    if (inputEl && outputEl && inputEl.value.trim()) {
      try {
        const d = new Date(inputEl.value.trim().replace(' ', 'T'));
        if (!isNaN(d.getTime())) {
          const trueDate = calibrateDvrIncidentTimestamp(d, res.deltaMs);
          outputEl.textContent = formatForensicTimestamp(trueDate);
        }
      } catch {}
    }
  }

  public getMilestones(): IncidentMilestone[] {
    return this.milestones;
  }
}
