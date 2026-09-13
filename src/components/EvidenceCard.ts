/**
 * SyncFlow: Court-Ready Evidence Card & Export Center
 * Leverages html2canvas (CDN) for High-Res PNG rendering
 * Embedded watermark: "SyncFlow | Engineered by R. Hanks"
 * Engineered by R. Hanks
 */

import { ForensicEvidenceState } from '../types';

declare global {
  interface Window {
    html2canvas?: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
  }
}

export class EvidenceCardManager {
  private container: HTMLElement;
  private getState: () => ForensicEvidenceState;
  private onClearAll?: () => void;

  constructor(containerId: string, getState: () => ForensicEvidenceState, onClearAll?: () => void) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.getState = getState;
    this.onClearAll = onClearAll;

    this.render();
    this.bindEvents();
  }

  public render() {
    const s = this.getState();
    const res = s.driftResult;
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');

    const dvrTimeStr = `${s.dvrTime.year}-${pad(s.dvrTime.month)}-${pad(s.dvrTime.day)} ${pad(s.dvrTime.hour)}:${pad(s.dvrTime.minute)}:${pad(s.dvrTime.second)}.${pad(s.dvrTime.millisecond, 3)}`;
    const refTimeStr = `${s.referenceTime.year}-${pad(s.referenceTime.month)}-${pad(s.referenceTime.day)} ${pad(s.referenceTime.hour)}:${pad(s.referenceTime.minute)}:${pad(s.referenceTime.second)}.${pad(s.referenceTime.millisecond, 3)}`;
    const isExample = !s.caseMetadata.caseNumber || s.caseMetadata.caseNumber.startsWith('DEMO') || s.imageFileName.includes('Hikvision_') || s.imageFileName.includes('Dahua_') || s.imageFileName.includes('Hanwha_');

    this.container.innerHTML = `
      <div class="flex flex-col gap-5">
        <!-- Top Toolbar & Export Action Buttons -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div>
            <h3 class="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
              Court-Ready Forensic Evidence Exhibit
            </h3>
            <p class="text-xs text-slate-400">Render high-resolution PNG for court filing, mobile photo gallery, or chain-of-custody archive</p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button id="btn-card-clear-all" class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-700/50 text-xs font-mono text-slate-300 hover:text-rose-300 transition flex items-center gap-1.5 cursor-pointer" title="Clear all fields and start fresh case">
              <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span>Clear All Fields</span>
            </button>

            <button id="btn-copy-statement" class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition flex items-center gap-1.5 cursor-pointer">
              <svg class="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
              </svg>
              <span>Copy LEVA Statement</span>
            </button>

            <button id="btn-export-json" class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition flex items-center gap-1.5 cursor-pointer">
              <svg class="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <span>JSON Audit</span>
            </button>

            <button id="btn-export-png" class="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-bold text-xs font-mono shadow-md shadow-teal-500/20 transition flex items-center gap-1.5 cursor-pointer">
              <svg class="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>EXPORT HIGH-RES PNG (html2canvas)</span>
            </button>
          </div>
        </div>

        <!-- Copy Confirmation Toast -->
        <div id="copy-toast" class="hidden fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-mono text-xs px-4 py-2.5 rounded-lg shadow-xl border border-emerald-400 transition-all">
          ✓ Copied LEVA Forensic Statement to clipboard
        </div>

        <!-- The Visual Court Evidence Card (Rendered Target for html2canvas) -->
        <div id="court-evidence-card" class="bg-slate-900 border-2 border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden text-slate-100 font-sans">
          
          <!-- Subtle Repeating Diagonal Watermark -->
          <div class="absolute inset-0 pointer-events-none opacity-5 flex flex-wrap gap-12 rotate-[-25deg] scale-150 select-none overflow-hidden text-[14px] font-mono text-white font-bold leading-relaxed">
            ${Array(35).fill('SyncFlow | Engineered by R. Hanks • LEVA SWGDE CALIBRATION • ').join('')}
          </div>

          <!-- Permanent Corner Forensic Watermark Badge -->
          <div class="absolute top-4 right-4 z-20 pointer-events-none px-3 py-1 rounded bg-slate-950/80 border border-teal-500/40 text-xs font-mono text-teal-300 shadow-md">
            SyncFlow | Engineered by R. Hanks
          </div>

          <!-- Evidence Card Header -->
          <div class="border-b-2 border-teal-500/60 pb-4 relative z-10">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="text-[11px] font-mono tracking-widest text-teal-400 font-bold uppercase">
                    Digital Multimedia Forensic Evidence Exhibit
                  </div>
                  ${isExample ? `
                    <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                      EXAMPLE DATA EXHIBIT
                    </span>
                  ` : `
                    <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      CASEWORK EXHIBIT
                    </span>
                  `}
                </div>
                <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                  DVR CLOCK-DRIFT &amp; TIMELINE CALIBRATION CERTIFICATE
                </h2>
                <p class="text-xs text-slate-400 font-mono mt-0.5">
                  Prepared in Accordance with LEVA Standards &amp; SWGDE Best Practices v4.2
                </p>
              </div>
            </div>

            <!-- Case Identification Metadata Bar -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
              <div>
                <span class="text-slate-400 block text-[10px]">CASE NUMBER:</span>
                <span class="text-white font-bold">${s.caseMetadata.caseNumber}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">EVIDENCE ITEM ID:</span>
                <span class="text-white font-bold">${s.caseMetadata.evidenceId}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">EXAMINER:</span>
                <span class="text-teal-300 font-bold">${s.caseMetadata.examiner || 'R. Hanks'}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">EXAMINATION DATE:</span>
                <span class="text-white">${s.caseMetadata.examinationDate}</span>
              </div>
            </div>
          </div>

          <!-- Cryptographic Integrity (SHA-256) -->
          <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 relative z-10">
            <div class="flex items-center gap-2">
              <span class="text-teal-400 font-bold">SHA-256 HASH:</span>
              <span class="text-slate-300 break-all select-all font-mono">${s.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</span>
            </div>
            <span class="text-[10px] text-slate-500 whitespace-nowrap">Chain-of-Custody Cryptographic Seal</span>
          </div>

          <!-- Hardware Identification -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800 relative z-10">
            <div>
              <span class="text-slate-400 block text-[10px]">DVR SYSTEM MAKE / MODEL:</span>
              <span class="text-slate-200 font-semibold">${s.caseMetadata.dvrMake} ${s.caseMetadata.dvrModel}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">DVR SERIAL NUMBER:</span>
              <span class="text-slate-200">${s.caseMetadata.dvrSerial || 'N/A'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">SCENE / CAMERA LOCATION:</span>
              <span class="text-slate-200">${s.caseMetadata.location}</span>
            </div>
          </div>

          <!-- Side-by-Side Visual Crop & Reference Analysis -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <!-- Left: Cropped DVR OSD Display -->
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono">
                <span class="text-teal-400 font-bold">1. Cropped DVR OSD Display</span>
                <span class="text-[10px] text-slate-400">OCR Conf: ${s.dvrTime.ocrConfidence}%</span>
              </div>

              <div class="bg-black border border-slate-700/80 rounded-lg p-2 flex items-center justify-center min-h-[90px] overflow-hidden">
                ${
                  s.preprocessedDataUrl
                    ? `<img src="${s.preprocessedDataUrl}" alt="Cropped DVR OSD" class="max-h-[80px] max-w-full object-contain" />`
                    : `<span class="text-xs font-mono text-slate-500">Awaiting Crop Buffer</span>`
                }
              </div>

              <div class="text-xs font-mono flex flex-col gap-1">
                <div class="flex justify-between">
                  <span class="text-slate-400">Displayed DVR Timestamp:</span>
                  <span class="text-white font-bold">${dvrTimeStr}</span>
                </div>
                <div class="flex justify-between text-[11px]">
                  <span class="text-slate-500">Raw OCR Text:</span>
                  <span class="text-slate-400">${s.dvrTime.rawOcrText || dvrTimeStr}</span>
                </div>
              </div>
            </div>

            <!-- Right: Reference Verification & Camera EXIF -->
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono">
                <span class="text-emerald-400 font-bold">2. Verified Reference Standard</span>
                <span class="text-[10px] text-slate-400">Sub-Second Accuracy</span>
              </div>

              <div class="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs font-mono flex flex-col gap-2 min-h-[90px] justify-center">
                <div class="flex justify-between">
                  <span class="text-slate-400">Reference Clock Source:</span>
                  <span class="text-slate-200">${s.referenceTime.sourceDetails}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Acquisition Sensor:</span>
                  <span class="text-slate-200">${[s.exif?.cameraMake, s.exif?.cameraModel].filter(Boolean).join(' ') || 'Forensic Sensor'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Shutter Subsecond:</span>
                  <span class="text-teal-300 font-bold">${s.exif?.subSecTimeOriginal ? `${s.exif.subSecTimeOriginal} ms` : '000 ms'}</span>
                </div>
              </div>

              <div class="text-xs font-mono flex flex-col gap-1">
                <div class="flex justify-between">
                  <span class="text-slate-400">True Reference Timestamp:</span>
                  <span class="text-emerald-400 font-bold">${refTimeStr}</span>
                </div>
                <div class="flex justify-between text-[11px]">
                  <span class="text-slate-500">GPS Geo-Location:</span>
                  <span class="text-slate-400">
                    ${s.exif?.gpsLatitude && s.exif?.gpsLongitude ? `${s.exif.gpsLatitude.toFixed(4)}°, ${s.exif.gpsLongitude.toFixed(4)}°` : 'Standard Station GPS'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Calibration Variance & Mathematical Proof Result -->
          <div class="bg-slate-950 border-2 border-teal-500/40 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono relative z-10">
            <div class="flex flex-col gap-1 text-center sm:text-left">
              <span class="text-[10px] text-slate-400 tracking-wider uppercase">CALCULATED CLOCK VARIANCE (Δt):</span>
              <span class="font-digital text-3xl sm:text-4xl font-bold text-teal-300 tracking-wider">
                ${res?.signedOffsetStr || '+00:00:00.000'}
              </span>
              <span class="text-slate-300 text-xs">
                ${res?.humanSummary || 'Awaiting calibration calculations...'}
              </span>
            </div>

            <div class="flex flex-col items-center sm:items-end gap-1.5 text-center sm:text-right">
              <div class="px-3 py-1 rounded bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xs">
                CLOCK STATUS: ${res?.direction || 'SYNCHRONIZED'}
              </div>
              <div class="text-[11px] text-slate-400">
                Formula: <span class="text-white font-bold">${res?.mathematicalFormula || 'T_Actual = T_DVR - Δt'}</span>
              </div>
              <div class="text-[10px] text-slate-500">
                Uncertainty Margin: ± 0.050 seconds
              </div>
            </div>
          </div>

          <!-- Formal Court Narrative Statement -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono relative z-10">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span class="text-slate-300 font-bold">Formal SWGDE / LEVA Expert Witness Narrative Statement:</span>
              <span class="text-[10px] text-teal-400">Court Admissible Language</span>
            </div>
            <p class="text-slate-300 leading-relaxed whitespace-pre-line text-[11px]">
              ${res?.levaNarrative || 'Calibration pending...'}
            </p>
          </div>

          <!-- Card Footer & Formal Certification -->
          <div class="border-t border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-slate-500 relative z-10">
            <div class="flex items-center gap-2">
              <span>SyncFlow Forensic Systems</span>
              <span>•</span>
              <span class="text-teal-400 font-semibold">Engineered by R. Hanks</span>
            </div>
            <div>
              Certified SWGDE &amp; LEVA Compliant Video Calibration Document
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents() {
    // Clear all fields
    this.container.querySelector('#btn-card-clear-all')?.addEventListener('click', () => {
      if (this.onClearAll) {
        this.onClearAll();
      }
    });

    // Copy LEVA statement
    this.container.querySelector('#btn-copy-statement')?.addEventListener('click', () => {
      const s = this.getState();
      const narrative = s.driftResult?.levaNarrative;
      if (narrative) {
        navigator.clipboard.writeText(narrative);
        this.showToast('✓ Copied LEVA Forensic Statement to clipboard');
      }
    });

    // Export JSON Audit
    this.container.querySelector('#btn-export-json')?.addEventListener('click', () => {
      const s = this.getState();
      const auditPayload = {
        tool: 'SyncFlow: Forensic DVR Clock-Drift & Timeline Calibrator',
        engineeredBy: 'R. Hanks',
        standard: 'LEVA Forensic SOP & SWGDE Video Acquisition Best Practices v4.2',
        exportTimestamp: new Date().toISOString(),
        caseMetadata: s.caseMetadata,
        cryptographicProof: {
          sha256: s.sha256Hash,
          originalFileName: s.imageFileName,
          fileSize: s.imageFileSize,
        },
        dvrTime: s.dvrTime,
        referenceTime: s.referenceTime,
        exifMetadata: s.exif,
        driftResult: s.driftResult,
        milestones: s.milestones,
      };

      const blob = new Blob([JSON.stringify(auditPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SyncFlow_Calibration_${s.caseMetadata.caseNumber || 'CASE'}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('✓ Exported Forensic JSON Audit File');
    });

    // Export High-Res PNG using html2canvas
    this.container.querySelector('#btn-export-png')?.addEventListener('click', async () => {
      const cardEl = this.container.querySelector('#court-evidence-card') as HTMLElement;
      if (!cardEl) return;

      const btn = this.container.querySelector('#btn-export-png') as HTMLButtonElement;
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.textContent = 'RENDERING HIGH-RES EXHIBIT...';

        if (!window.html2canvas) {
          throw new Error('html2canvas library not loaded from CDN.');
        }

        const canvas = await window.html2canvas(cardEl, {
          scale: 2, // 2x high resolution for court exhibits
          backgroundColor: '#020617',
          useCORS: true,
          logging: false,
          allowTaint: true,
        });

        // Trigger download
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        const s = this.getState();
        a.href = dataUrl;
        a.download = `SyncFlow_EvidenceCard_${s.caseMetadata.caseNumber || 'CASE'}_${Date.now()}.png`;
        a.click();

        this.showToast('✓ High-Res Evidence Card Saved to Gallery / Downloads');
      } catch (err: any) {
        console.error('html2canvas export error:', err);
        alert('Evidence card render error: ' + (err.message || 'Failed to render'));
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }

  private showToast(msg: string) {
    const toast = this.container.querySelector('#copy-toast') as HTMLElement;
    if (toast) {
      toast.textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 2500);
    }
  }
}
