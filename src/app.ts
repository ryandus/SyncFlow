/**
 * SyncFlow: Forensic DVR Clock-Drift & Timeline Calibrator
 * Master Application Controller & Orchestrator
 * Adheres to LEVA Protocols & SWGDE Evidence Recovery Standards
 * Engineered by R. Hanks
 */

import { ForensicEvidenceState } from './types';
import { calculateSha256, formatFileSize } from './utils/crypto';
import { parseExifMetadata } from './utils/exifParser';
import { calculateClockDrift } from './utils/calibrationMath';
import { FORENSIC_DEMO_CASES } from './utils/demoData';

import { renderHeader } from './components/Header';
import { renderFooter } from './components/Footer';
import { CameraCaptureModal } from './components/CameraCapture';
import { InteractiveCropCanvas } from './components/InteractiveCanvas';
import { OcrVerificationPanel } from './components/OcrPanel';
import { ReferenceTimePanel } from './components/ReferenceTimePanel';
import { DriftResultsPanel } from './components/DriftResultsPanel';
import { TimelineConverter } from './components/TimelineConverter';
import { EvidenceCardManager } from './components/EvidenceCard';

export class SyncFlowApp {
  private root: HTMLElement;
  private state: ForensicEvidenceState;

  // Sub-components
  private cameraModal!: CameraCaptureModal;
  private cropCanvas!: InteractiveCropCanvas;
  private ocrPanel!: OcrVerificationPanel;
  private refPanel!: ReferenceTimePanel;
  private driftPanel!: DriftResultsPanel;
  private timelineConverter!: TimelineConverter;
  private cardManager!: EvidenceCardManager;
  private activeDemoIndex: number | null = 0;

  constructor(root: HTMLElement) {
    this.root = root;

    // Initialize with Demo 1 defaults (Hikvision case)
    const demo1 = FORENSIC_DEMO_CASES[0];

    this.state = {
      imageFile: null,
      imageSrc: null,
      imageFileName: 'Hikvision_Calibration_Frame_Cam02.jpg',
      imageFileSize: 1428500,
      sha256Hash: '3f8b72c918e9508d519b78848f32145e12850892019da8e8091811a2f641b0d2',
      exif: demo1.exif,
      cropRoi: demo1.cropDefault,
      preprocess: {
        grayscale: true,
        invert: false,
        contrast: 135,
        brightness: 10,
        threshold: 0,
      },
      croppedDataUrl: null,
      preprocessedDataUrl: null,
      dvrTime: demo1.dvrTime,
      referenceTime: demo1.referenceTime,
      driftResult: null,
      caseMetadata: demo1.caseMetadata,
      milestones: [],
      multiPoint: { enabled: false },
      isOcrProcessing: false,
      ocrProgress: 0,
      ocrStatusMessage: '',
    };

    // Calculate initial drift
    this.state.driftResult = calculateClockDrift(
      this.state.dvrTime,
      this.state.referenceTime,
      this.state.caseMetadata
    );

    this.mountApp();
  }

  private mountApp() {
    this.root.innerHTML = `
      <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500/30 selection:text-teal-200">
        <!-- Top App Header with "Engineered by R. Hanks" -->
        ${renderHeader()}

        <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 flex flex-col gap-6">
          
          <!-- Forensic Benchmark Examples & Test Suites (LEVA Case Studies) -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    FORENSIC BENCHMARK EXAMPLES
                  </span>
                  <span class="text-xs text-slate-400 font-mono">LEVA &amp; SWGDE Test Bench</span>
                </div>
                <h2 class="text-base font-bold text-white mt-1">
                  CCTV Clock-Drift Demonstration Scenarios
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">
                  Select a pre-configured CCTV DVR benchmark case to test the calibration algorithm, or clear all fields to perform fresh casework.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button id="btn-master-clear-fields" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/60 text-xs font-mono font-semibold text-rose-300 transition flex items-center gap-1.5 shadow-sm cursor-pointer" title="Wipe all demonstration data for fresh casework">
                  <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  <span>Clear All Example Fields</span>
                </button>
              </div>
            </div>

            <!-- 3 Obvious Example Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <!-- Example 1 Card -->
              <div id="card-demo-1" class="bg-slate-950/80 border-2 border-teal-500/80 rounded-lg p-3.5 flex flex-col justify-between gap-3 transition hover:border-teal-400 cursor-pointer shadow-sm">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="text-xs font-bold text-white flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>Example 1: Hikvision DS-7208</span>
                    </span>
                    <div class="text-[11px] text-slate-400 mt-0.5">Robbery Case • DEMO-2026-0814</div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                    SLOW (-3m 17s)
                  </span>
                </div>
                <div class="text-[11px] font-mono bg-slate-900/90 rounded p-2 border border-slate-800 space-y-1">
                  <div class="flex justify-between">
                    <span class="text-slate-400">DVR OSD:</span>
                    <span class="text-teal-300 font-semibold">19:42:15.000</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Reference:</span>
                    <span class="text-emerald-300 font-semibold">19:45:32.450</span>
                  </div>
                </div>
                <button id="btn-load-demo-1" class="w-full py-1.5 px-3 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-mono font-bold transition cursor-pointer">
                  ✓ Active Example 1 (Slow)
                </button>
              </div>

              <!-- Example 2 Card -->
              <div id="card-demo-2" class="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-3 transition hover:border-emerald-500/60 cursor-pointer shadow-sm">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="text-xs font-bold text-white flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Example 2: Dahua NVR5216</span>
                    </span>
                    <div class="text-[11px] text-slate-400 mt-0.5">Commercial Burglary • DEMO-2026-1102</div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                    FAST (+2m 14s)
                  </span>
                </div>
                <div class="text-[11px] font-mono bg-slate-900/90 rounded p-2 border border-slate-800 space-y-1">
                  <div class="flex justify-between">
                    <span class="text-slate-400">DVR OSD:</span>
                    <span class="text-teal-300 font-semibold">02:18:40.000</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Reference:</span>
                    <span class="text-emerald-300 font-semibold">02:16:26.000</span>
                  </div>
                </div>
                <button id="btn-load-demo-2" class="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition cursor-pointer">
                  Load Example 2 (Fast)
                </button>
              </div>

              <!-- Example 3 Card -->
              <div id="card-demo-3" class="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-3 transition hover:border-cyan-500/60 cursor-pointer shadow-sm">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="text-xs font-bold text-white flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <span>Example 3: Hanwha QRN-810S</span>
                    </span>
                    <div class="text-[11px] text-slate-400 mt-0.5">Traffic Hit &amp; Run • DEMO-2026-0419</div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 whitespace-nowrap">
                    SUB-SEC (+18.88s)
                  </span>
                </div>
                <div class="text-[11px] font-mono bg-slate-900/90 rounded p-2 border border-slate-800 space-y-1">
                  <div class="flex justify-between">
                    <span class="text-slate-400">DVR OSD:</span>
                    <span class="text-teal-300 font-semibold">14:05:30.000</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Reference:</span>
                    <span class="text-emerald-300 font-semibold">14:05:11.120</span>
                  </div>
                </div>
                <button id="btn-load-demo-3" class="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition cursor-pointer">
                  Load Example 3 (Sub-Sec)
                </button>
              </div>
            </div>

            <!-- Active Example Status / Clean Casework Alert Strip -->
            <div id="demo-status-strip" class="rounded-lg p-3 bg-amber-950/30 border border-amber-500/40 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-amber-400 font-bold flex items-center gap-1.5">
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <span id="demo-status-title">EXAMPLE DATA LOADED:</span>
                </span>
                <span id="demo-status-desc" class="text-slate-300">
                  Hikvision Benchmark Scenario. All timestamps, CCTV frame simulation, and case metadata are demonstration values.
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button id="btn-strip-clear" class="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1">
                  <span>Clear Example Fields</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Section: Evidence Acquisition & Case Details -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- Left: File Upload & Camera Acquisition (7 Cols) -->
            <div class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                  <h2 class="font-bold text-white text-base">
                    Evidence Image Acquisition
                  </h2>
                </div>
                <span class="text-xs font-mono text-slate-400">
                  SWGDE Physical Acquisition
                </span>
              </div>

              <!-- Drag & Drop Zone -->
              <div id="drop-zone" class="border-2 border-dashed border-slate-700 hover:border-teal-500/60 bg-slate-950/60 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition group">
                <input type="file" id="file-input" accept="image/*,.heic,.tiff,.bmp" class="hidden" />
                
                <div class="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-teal-500/20 text-slate-400 group-hover:text-teal-300 flex items-center justify-center transition">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>

                <div class="text-xs font-mono">
                  <span class="text-teal-400 font-semibold">Tap to select photo</span>
                  <span class="text-slate-400"> or drag &amp; drop DVR frame</span>
                </div>
                <p class="text-[11px] text-slate-500 font-mono">
                  Direct client-side parsing • JPEG, PNG, HEIC, TIFF • Zero cloud uploads
                </p>
              </div>

              <!-- Active File Cryptographic Audit Strip -->
              <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Current Evidence File:</span>
                  <span id="label-filename" class="text-white font-semibold truncate max-w-[240px]">${this.state.imageFileName}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">SHA-256 Checksum:</span>
                  <span id="label-sha256" class="text-teal-400 font-mono text-[11px] truncate max-w-[280px]" title="${this.state.sha256Hash}">${this.state.sha256Hash}</span>
                </div>
              </div>
            </div>

            <!-- Right: Case Metadata Panel (5 Cols) -->
            <div class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-semibold text-slate-300">
                    Case &amp; Evidence Identification
                  </span>
                  <span id="meta-demo-tag" class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    EXAMPLE DATA
                  </span>
                </div>
                <button id="btn-clear-case-meta" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/50 text-slate-400 hover:text-rose-300 text-[11px] font-mono transition flex items-center gap-1 cursor-pointer" title="Reset case number and examiner fields">
                  <svg class="w-3 h-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  <span>Clear Case Fields</span>
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span class="text-[10px] text-slate-400 block">Case Number:</span>
                  <input type="text" id="meta-case-num" value="${this.state.caseMetadata.caseNumber}" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block">Evidence Item ID:</span>
                  <input type="text" id="meta-item-id" value="${this.state.caseMetadata.evidenceId}" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                </div>
                <div class="col-span-2">
                  <span class="text-[10px] text-slate-400 block">Investigating Agency / Lab:</span>
                  <input type="text" id="meta-agency" value="${this.state.caseMetadata.agency}" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block">Forensic Examiner:</span>
                  <input type="text" id="meta-examiner" value="${this.state.caseMetadata.examiner}" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block">Exam Date:</span>
                  <input type="date" id="meta-date" value="${this.state.caseMetadata.examinationDate}" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                </div>
                <div class="col-span-2">
                  <span class="text-[10px] text-slate-400 block">DVR Hardware Model:</span>
                  <input type="text" id="meta-dvr-model" value="${this.state.caseMetadata.dvrMake} ${this.state.caseMetadata.dvrModel}" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                </div>
              </div>
            </div>
          </div>

          <!-- Section: Interactive Mobile-First ROI Crop Canvas -->
          <div id="crop-canvas-container"></div>

          <!-- Section: Two-Column Step 1 (DVR OCR) and Step 2 (Reference Time) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="ocr-panel-container"></div>
            <div id="ref-panel-container"></div>
          </div>

          <!-- Section: Calculated Clock-Drift Results & Digital Display -->
          <div id="drift-results-container"></div>

          <!-- Section: Incident Timeline Calibrator & Milestone Table -->
          <div id="timeline-converter-container"></div>

          <!-- Section: Court-Ready Evidence Card Exhibit -->
          <div id="evidence-card-container"></div>

        </main>

        <!-- Footer with "Engineered by R. Hanks" -->
        ${renderFooter()}
      </div>
    `;

    // Instantiate sub-components
    this.cameraModal = new CameraCaptureModal((blob, ts) => this.handleCameraCapture(blob, ts));

    this.cropCanvas = new InteractiveCropCanvas('crop-canvas-container', (cropped, preproc) => {
      this.state.croppedDataUrl = cropped.toDataURL();
      this.state.preprocessedDataUrl = preproc.toDataURL();
      this.cardManager?.render();
    });

    this.ocrPanel = new OcrVerificationPanel(
      'ocr-panel-container',
      this.state.dvrTime,
      () => {
        const preview = document.getElementById('roi-preview-canvas') as HTMLCanvasElement;
        return preview;
      },
      (updatedDvr) => {
        this.state.dvrTime = updatedDvr;
        this.recalculateDrift();
      }
    );

    this.refPanel = new ReferenceTimePanel(
      'ref-panel-container',
      this.state.referenceTime,
      this.state.exif,
      (updatedRef) => {
        this.state.referenceTime = updatedRef;
        this.recalculateDrift();
      }
    );

    this.driftPanel = new DriftResultsPanel('drift-results-container', this.state.driftResult);
    this.timelineConverter = new TimelineConverter('timeline-converter-container', this.state.driftResult);
    this.cardManager = new EvidenceCardManager(
      'evidence-card-container',
      () => this.state,
      () => this.clearAllFields()
    );

    this.bindMasterEvents();
    this.loadInitialDemo();
  }

  private loadInitialDemo() {
    this.loadDemoCase(FORENSIC_DEMO_CASES[0], 0);
  }

  private loadDemoCase(demo: typeof FORENSIC_DEMO_CASES[0], index: number = 0) {
    this.activeDemoIndex = index;
    const canvas = demo.renderCanvas();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const img = new Image();
    img.onload = () => {
      this.state.imageSrc = dataUrl;
      this.state.imageFileName = `${demo.dvrModel.replace(/\s+/g, '_')}_Frame.jpg`;
      this.state.imageFileSize = 1240000;
      this.state.caseMetadata = { ...demo.caseMetadata };
      this.state.dvrTime = { ...demo.dvrTime };
      this.state.referenceTime = { ...demo.referenceTime };
      this.state.exif = { ...demo.exif };

      // Update UI displays
      const fnEl = document.getElementById('label-filename');
      if (fnEl) fnEl.textContent = this.state.imageFileName;

      this.updateMetadataInputs();

      // Compute hash for demo canvas
      canvas.toBlob(async (b) => {
        if (b) {
          const hash = await calculateSha256(b);
          this.state.sha256Hash = hash;
          const hashEl = document.getElementById('label-sha256');
          if (hashEl) hashEl.textContent = hash;
        }
      });

      this.cropCanvas.setImage(img, demo.cropDefault);
      this.ocrPanel.setRecord(this.state.dvrTime);
      this.refPanel.setRecord(this.state.referenceTime);
      if (this.state.exif) this.refPanel.updateExif(this.state.exif);

      this.updateDemoUiState();
      this.recalculateDrift();
      this.showToast(`Loaded Demonstration Case ${index + 1}: ${demo.dvrModel}`);
    };
    img.src = dataUrl;
  }

  public clearAllFields() {
    this.activeDemoIndex = null;

    // Reset Case Identification fields
    this.state.caseMetadata = {
      caseNumber: '',
      evidenceId: '',
      agency: '',
      examiner: '',
      examinationDate: new Date().toISOString().split('T')[0],
      dvrMake: '',
      dvrModel: '',
      dvrSerial: '',
      location: '',
      notes: '',
    };

    // Reset image and cryptographic metadata
    this.state.imageFile = null;
    this.state.imageSrc = null;
    this.state.imageFileName = 'No evidence file loaded';
    this.state.imageFileSize = 0;
    this.state.sha256Hash = 'Awaiting evidence file...';
    this.state.croppedDataUrl = null;
    this.state.preprocessedDataUrl = null;
    this.state.exif = null;

    // Clear Canvas and OCR/Ref panels
    this.cropCanvas.clearImage();
    this.ocrPanel.clearFields();
    this.refPanel.clearFields();
    this.timelineConverter.clearMilestones();

    // Update UI Elements
    const fnEl = document.getElementById('label-filename');
    const hashEl = document.getElementById('label-sha256');
    if (fnEl) fnEl.textContent = 'No evidence file loaded';
    if (hashEl) hashEl.textContent = 'Awaiting evidence file...';

    this.updateMetadataInputs();
    this.updateDemoUiState();
    this.recalculateDrift();

    this.showToast('✓ All fields and example data cleared. Ready for new casework.');
  }

  public clearCaseFields() {
    this.state.caseMetadata.caseNumber = '';
    this.state.caseMetadata.evidenceId = '';
    this.state.caseMetadata.agency = '';
    this.state.caseMetadata.examiner = '';
    this.state.caseMetadata.dvrMake = '';
    this.state.caseMetadata.dvrModel = '';
    this.state.caseMetadata.notes = '';

    this.updateMetadataInputs();
    this.recalculateDrift();
    this.showToast('✓ Case identification fields cleared.');
  }

  private updateDemoUiState() {
    const isDemo = this.activeDemoIndex !== null;
    const metaTag = document.getElementById('meta-demo-tag');
    const statusStrip = document.getElementById('demo-status-strip');
    const statusTitle = document.getElementById('demo-status-title');
    const statusDesc = document.getElementById('demo-status-desc');

    // Update metadata tag
    if (metaTag) {
      if (isDemo) {
        metaTag.className = 'px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold';
        metaTag.textContent = `EXAMPLE DATA (Demo ${(this.activeDemoIndex ?? 0) + 1})`;
      } else {
        metaTag.className = 'px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold';
        metaTag.textContent = 'CLEAN CASEWORK';
      }
    }

    // Update status banner
    if (statusStrip && statusTitle && statusDesc) {
      if (isDemo) {
        const demo = FORENSIC_DEMO_CASES[this.activeDemoIndex!];
        statusStrip.className = 'rounded-lg p-3 bg-amber-950/30 border border-amber-500/40 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2';
        statusTitle.textContent = `EXAMPLE DATA ACTIVE (Demo ${this.activeDemoIndex! + 1}):`;
        statusTitle.parentElement?.classList.remove('text-emerald-400');
        statusTitle.parentElement?.classList.add('text-amber-400');
        statusDesc.textContent = `${demo.dvrModel} Benchmark Scenario. All timestamps and case parameters are mock demonstration values.`;
      } else {
        statusStrip.className = 'rounded-lg p-3 bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2';
        statusTitle.textContent = 'CLEAN CASEWORK MODE:';
        statusTitle.parentElement?.classList.remove('text-amber-400');
        statusTitle.parentElement?.classList.add('text-emerald-400');
        statusDesc.textContent = 'All demonstration data wiped. Ready for your actual evidence images and certified calibration timestamps.';
      }
    }

    // Update demo cards highlight
    [0, 1, 2].forEach((idx) => {
      const card = document.getElementById(`card-demo-${idx + 1}`);
      const btn = document.getElementById(`btn-load-demo-${idx + 1}`);
      if (!card || !btn) return;

      if (this.activeDemoIndex === idx) {
        card.classList.remove('border-slate-800');
        card.classList.add('border-teal-400', 'bg-slate-900/90');
        btn.className = 'w-full py-1.5 px-3 rounded bg-teal-500/30 text-teal-200 border border-teal-500/50 text-xs font-mono font-bold transition cursor-pointer';
        btn.textContent = `✓ Active Example ${idx + 1}`;
      } else {
        card.classList.remove('border-teal-400', 'bg-slate-900/90');
        card.classList.add('border-slate-800');
        btn.className = 'w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition cursor-pointer';
        btn.textContent = `Load Example ${idx + 1}`;
      }
    });
  }

  public showToast(message: string) {
    let toast = document.getElementById('syncflow-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'syncflow-toast';
      toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-slate-900 border border-teal-500/50 text-white text-xs font-mono shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0 flex items-center gap-2';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span><span>${message}</span>`;
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      if (toast) {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-4', 'opacity-0');
      }
    }, 3200);
  }

  private updateMetadataInputs() {
    const metaCase = document.getElementById('meta-case-num') as HTMLInputElement;
    const metaItem = document.getElementById('meta-item-id') as HTMLInputElement;
    const metaAgency = document.getElementById('meta-agency') as HTMLInputElement;
    const metaExam = document.getElementById('meta-examiner') as HTMLInputElement;
    const metaDate = document.getElementById('meta-date') as HTMLInputElement;
    const metaModel = document.getElementById('meta-dvr-model') as HTMLInputElement;

    if (metaCase) metaCase.value = this.state.caseMetadata.caseNumber;
    if (metaItem) metaItem.value = this.state.caseMetadata.evidenceId;
    if (metaAgency) metaAgency.value = this.state.caseMetadata.agency;
    if (metaExam) metaExam.value = this.state.caseMetadata.examiner;
    if (metaDate) metaDate.value = this.state.caseMetadata.examinationDate;
    if (metaModel) metaModel.value = `${this.state.caseMetadata.dvrMake} ${this.state.caseMetadata.dvrModel}`.trim();
  }

  private recalculateDrift() {
    this.state.driftResult = calculateClockDrift(
      this.state.dvrTime,
      this.state.referenceTime,
      this.state.caseMetadata
    );

    this.driftPanel.updateResult(this.state.driftResult);
    this.timelineConverter.updateResult(this.state.driftResult);
    this.cardManager.render();
  }

  private bindMasterEvents() {
    // Demo loaders
    [0, 1, 2].forEach((idx) => {
      const btn = document.getElementById(`btn-load-demo-${idx + 1}`);
      const card = document.getElementById(`card-demo-${idx + 1}`);
      btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadDemoCase(FORENSIC_DEMO_CASES[idx], idx);
      });
      card?.addEventListener('click', () => {
        this.loadDemoCase(FORENSIC_DEMO_CASES[idx], idx);
      });
    });

    // Clear All Buttons (Header, Demo Section, Status Strip, Evidence Card)
    document.getElementById('btn-header-clear-all')?.addEventListener('click', () => this.clearAllFields());
    document.getElementById('btn-master-clear-fields')?.addEventListener('click', () => this.clearAllFields());
    document.getElementById('btn-strip-clear')?.addEventListener('click', () => this.clearAllFields());
    document.getElementById('btn-clear-case-meta')?.addEventListener('click', () => this.clearCaseFields());

    // Live Camera button
    document.getElementById('btn-open-camera')?.addEventListener('click', () => this.cameraModal.open());

    // File input & Drag-and-drop
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input') as HTMLInputElement;

    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-teal-400');
    });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('border-teal-400'));
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-teal-400');
      if (e.dataTransfer?.files.length) {
        this.processUploadedFile(e.dataTransfer.files[0]);
      }
    });

    fileInput?.addEventListener('change', () => {
      if (fileInput.files?.length) {
        this.processUploadedFile(fileInput.files[0]);
      }
    });

    // Metadata field live updates
    const onMetaChange = () => {
      const metaCase = (document.getElementById('meta-case-num') as HTMLInputElement)?.value;
      const metaItem = (document.getElementById('meta-item-id') as HTMLInputElement)?.value;
      const metaAgency = (document.getElementById('meta-agency') as HTMLInputElement)?.value;
      const metaExam = (document.getElementById('meta-examiner') as HTMLInputElement)?.value;
      const metaDate = (document.getElementById('meta-date') as HTMLInputElement)?.value;

      this.state.caseMetadata.caseNumber = metaCase || 'CASE-2026';
      this.state.caseMetadata.evidenceId = metaItem || 'EV-01';
      this.state.caseMetadata.agency = metaAgency || 'Forensic Agency';
      this.state.caseMetadata.examiner = metaExam || 'R. Hanks';
      this.state.caseMetadata.examinationDate = metaDate || new Date().toISOString().split('T')[0];

      this.recalculateDrift();
    };

    ['meta-case-num', 'meta-item-id', 'meta-agency', 'meta-examiner', 'meta-date', 'meta-dvr-model'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', onMetaChange);
    });

    // Update CDN status pills
    this.checkCdnStatus();
  }

  private checkCdnStatus() {
    const exifPill = document.getElementById('cdn-status-exif');
    const ocrPill = document.getElementById('cdn-status-ocr');
    const h2cPill = document.getElementById('cdn-status-h2c');

    const updatePills = () => {
      if (window.ExifReader && exifPill) {
        exifPill.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>ExifReader Ready</span>';
      }
      if (window.Tesseract && ocrPill) {
        ocrPill.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>Tesseract.js Ready</span>';
      }
      if (window.html2canvas && h2cPill) {
        h2cPill.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>html2canvas Ready</span>';
      }
    };

    updatePills();
    setTimeout(updatePills, 1000);
    setTimeout(updatePills, 3000);
  }

  private async processUploadedFile(file: File) {
    this.state.imageFile = file;
    this.state.imageFileName = file.name;
    this.state.imageFileSize = file.size;

    // 1. Calculate SHA-256 Hash
    const hash = await calculateSha256(file);
    this.state.sha256Hash = hash;

    // Update labels
    const fnEl = document.getElementById('label-filename');
    const hashEl = document.getElementById('label-sha256');
    if (fnEl) fnEl.textContent = file.name;
    if (hashEl) hashEl.textContent = hash;

    // 2. Parse EXIF
    const exif = await parseExifMetadata(file);
    this.state.exif = exif;
    this.refPanel.updateExif(exif);

    // 3. Load image into canvas
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      this.state.imageSrc = url;
      this.cropCanvas.setImage(img);
      this.recalculateDrift();
    };
    img.src = url;
  }

  private async handleCameraCapture(blob: Blob, captureTime: Date) {
    const fakeFile = new File([blob], `Camera_Capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
    this.state.imageFile = fakeFile;
    this.state.imageFileName = fakeFile.name;
    this.state.imageFileSize = blob.size;

    // SHA-256
    const hash = await calculateSha256(blob);
    this.state.sha256Hash = hash;

    const fnEl = document.getElementById('label-filename');
    const hashEl = document.getElementById('label-sha256');
    if (fnEl) fnEl.textContent = fakeFile.name;
    if (hashEl) hashEl.textContent = hash;

    // Set reference time to exact shutter moment
    this.state.referenceTime = {
      year: captureTime.getFullYear(),
      month: captureTime.getMonth() + 1,
      day: captureTime.getDate(),
      hour: captureTime.getHours(),
      minute: captureTime.getMinutes(),
      second: captureTime.getSeconds(),
      millisecond: captureTime.getMilliseconds(),
      source: 'nist',
      sourceDetails: `Live Forensic Camera Shutter (${fakeFile.name})`,
    };
    this.refPanel.setRecord(this.state.referenceTime);

    // Load into canvas
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      this.state.imageSrc = url;
      this.cropCanvas.setImage(img);
      this.recalculateDrift();
    };
    img.src = url;
  }
}

export function initSyncFlow(rootEl: HTMLElement) {
  return new SyncFlowApp(rootEl);
}
