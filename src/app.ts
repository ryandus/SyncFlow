/**
 * SyncFlow: Forensic DVR Clock-Drift & Timeline Calibrator
 * Master Application Controller & Orchestrator
 * Adheres to LEVA Protocols & SWGDE Evidence Recovery Standards
 * Engineered by R. Hanks
 */

import { ForensicEvidenceState } from './types';
import { calculateSha256 } from './utils/crypto';
import { parseExifMetadata } from './utils/exifParser';
import { calculateClockDrift } from './utils/calibrationMath';

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

  constructor(root: HTMLElement) {
    this.root = root;

    const today = new Date();
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    // Initialize with pristine, production-ready forensic casework defaults
    this.state = {
      imageFile: null,
      imageSrc: null,
      imageFileName: 'No evidence file loaded',
      imageFileSize: 0,
      sha256Hash: 'Awaiting evidence file...',
      exif: null,
      cropRoi: { x: 50, y: 50, width: 280, height: 60 },
      preprocess: {
        grayscale: true,
        invert: false,
        contrast: 135,
        brightness: 10,
        threshold: 0,
      },
      croppedDataUrl: null,
      preprocessedDataUrl: null,
      dvrTime: {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
        hour: 12,
        minute: 0,
        second: 0,
        millisecond: 0,
        rawOcrText: '',
        ocrConfidence: 0,
        isVerified: false,
      },
      referenceTime: {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
        hour: 12,
        minute: 0,
        second: 0,
        millisecond: 0,
        source: 'manual',
        sourceDetails: 'Manual Forensic Ground Truth',
      },
      driftResult: null,
      caseMetadata: {
        caseNumber: '',
        evidenceId: '',
        agency: '',
        examiner: 'R. Hanks',
        examinationDate: todayStr,
        dvrMake: '',
        dvrModel: '',
        dvrSerial: '',
        location: '',
        notes: '',
      },
      milestones: [
        {
          id: 'm-1',
          label: 'Suspect Enters Scene',
          dvrTimestamp: `${todayStr} 12:00:00`,
          calibratedTimestamp: '',
          notes: 'Subject observed entering perimeter on primary camera',
        },
      ],
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
          
          <!-- Top Section: Case & Evidence Identification (Top-Left) paired with Evidence Acquisition (Top-Right) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            <!-- Top-Left: Case & Evidence Identification (Occupies prominent visual space) -->
            <div class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm">
              <div>
                <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                    <h2 class="font-bold text-white text-base">
                      Case &amp; Evidence Identification
                    </h2>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                      LEVA Chain of Custody
                    </span>
                  </div>
                  <button id="btn-clear-case-meta" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/50 text-slate-400 hover:text-rose-300 text-xs font-mono transition flex items-center gap-1 cursor-pointer" title="Reset all case identification fields">
                    <svg class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    <span>Clear Case Fields</span>
                  </button>
                </div>
                <p class="text-xs text-slate-400 mt-2">
                  Enter official law enforcement incident details and DVR hardware specifications to establish an unbroken chain of custody for court testimony.
                </p>
              </div>

              <!-- Case Metadata Input Fields with Helper Text -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <!-- Case Number -->
                <div class="flex flex-col gap-1">
                  <label for="meta-case-num" class="text-[11px] font-semibold text-slate-300">Case Number:</label>
                  <input type="text" id="meta-case-num" value="${this.state.caseMetadata.caseNumber}" placeholder="e.g. 2026-CR-0891" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                  <span class="text-[9px] text-slate-500">Official police department or laboratory case identifier</span>
                </div>

                <!-- Evidence Item ID -->
                <div class="flex flex-col gap-1">
                  <label for="meta-item-id" class="text-[11px] font-semibold text-slate-300">Evidence Item ID:</label>
                  <input type="text" id="meta-item-id" value="${this.state.caseMetadata.evidenceId}" placeholder="e.g. ITEM-01 / DVR-A" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                  <span class="text-[9px] text-slate-500">Physical evidence barcode or item tag number</span>
                </div>

                <!-- Agency / Lab -->
                <div class="sm:col-span-2 flex flex-col gap-1">
                  <label for="meta-agency" class="text-[11px] font-semibold text-slate-300">Investigating Agency / Lab:</label>
                  <input type="text" id="meta-agency" value="${this.state.caseMetadata.agency}" placeholder="e.g. Forensic Video Analysis Unit, Metro Police" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                  <span class="text-[9px] text-slate-500">Law enforcement department, crime laboratory, or forensic division</span>
                </div>

                <!-- Examiner -->
                <div class="flex flex-col gap-1">
                  <label for="meta-examiner" class="text-[11px] font-semibold text-slate-300">Forensic Examiner:</label>
                  <input type="text" id="meta-examiner" value="${this.state.caseMetadata.examiner}" placeholder="e.g. R. Hanks, LEVA Tech" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                  <span class="text-[9px] text-slate-500">Name and credential of analyst performing calibration</span>
                </div>

                <!-- Exam Date -->
                <div class="flex flex-col gap-1">
                  <label for="meta-date" class="text-[11px] font-semibold text-slate-300">Examination Date:</label>
                  <input type="date" id="meta-date" value="${this.state.caseMetadata.examinationDate}" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                  <span class="text-[9px] text-slate-500">Official date on which timeline audit was conducted</span>
                </div>

                <!-- DVR Hardware Model -->
                <div class="sm:col-span-2 flex flex-col gap-1">
                  <label for="meta-dvr-model" class="text-[11px] font-semibold text-slate-300">DVR Hardware Make &amp; Model:</label>
                  <input type="text" id="meta-dvr-model" value="${this.state.caseMetadata.dvrMake ? `${this.state.caseMetadata.dvrMake} ${this.state.caseMetadata.dvrModel}`.trim() : ''}" placeholder="e.g. Hikvision DS-7208HUHI-K2 / Dahua NVR5216" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-400" />
                  <span class="text-[9px] text-slate-500">Manufacturer model or firmware version of the recovered CCTV recorder</span>
                </div>
              </div>
            </div>

            <!-- Top-Right: Evidence Image Acquisition (5 Cols) -->
            <div class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm">
              <div class="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
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
              <p class="text-xs text-slate-400">
                Acquire the calibration photograph or frame grab showing the DVR monitor clock. All image parsing and EXIF extraction executes 100% offline.
              </p>

              <!-- Drag & Drop Zone -->
              <div id="drop-zone" class="border-2 border-dashed border-slate-700 hover:border-teal-500/60 bg-slate-950/60 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition group">
                <input type="file" id="file-input" accept="image/*,.heic,.tiff,.bmp" class="hidden" />
                
                <div class="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-teal-500/20 text-slate-400 group-hover:text-teal-300 flex items-center justify-center transition">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>

                <div class="text-xs font-mono">
                  <span class="text-teal-400 font-semibold">Drag and drop the exported DVR frame here to begin extraction</span>
                  <span class="text-slate-400 block mt-0.5">or click to browse local files</span>
                </div>
                <p class="text-[10px] text-slate-500 font-mono">
                  Direct client-side memory parsing • JPEG, PNG, HEIC, TIFF • Zero cloud uploads
                </p>
              </div>

              <!-- Active File Cryptographic Audit Strip -->
              <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Current Evidence File:</span>
                  <span id="label-filename" class="text-white font-semibold truncate max-w-[200px]">${this.state.imageFileName}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">SHA-256 Hash:</span>
                  <span id="label-sha256" class="text-teal-400 font-mono text-[11px] truncate max-w-[240px]" title="${this.state.sha256Hash}">${this.state.sha256Hash}</span>
                </div>
                <span class="text-[9px] text-slate-500">Hash computed in-memory to preserve mathematical evidence integrity</span>
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
  }

  public clearAllFields() {
    // Reset Case Identification fields
    this.state.caseMetadata = {
      caseNumber: '',
      evidenceId: '',
      agency: '',
      examiner: 'R. Hanks',
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
    this.recalculateDrift();

    this.showToast('✓ All fields cleared. Ready for fresh forensic casework.');
  }

  public clearCaseFields() {
    this.state.caseMetadata.caseNumber = '';
    this.state.caseMetadata.evidenceId = '';
    this.state.caseMetadata.agency = '';
    this.state.caseMetadata.examiner = 'R. Hanks';
    this.state.caseMetadata.dvrMake = '';
    this.state.caseMetadata.dvrModel = '';
    this.state.caseMetadata.notes = '';

    this.updateMetadataInputs();
    this.recalculateDrift();
    this.showToast('✓ Case identification fields cleared.');
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
    // Clear All Buttons (Header, Evidence Card)
    document.getElementById('btn-header-clear-all')?.addEventListener('click', () => this.clearAllFields());
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
      const metaModel = (document.getElementById('meta-dvr-model') as HTMLInputElement)?.value;

      this.state.caseMetadata.caseNumber = metaCase || '';
      this.state.caseMetadata.evidenceId = metaItem || '';
      this.state.caseMetadata.agency = metaAgency || '';
      this.state.caseMetadata.examiner = metaExam || 'R. Hanks';
      this.state.caseMetadata.examinationDate = metaDate || new Date().toISOString().split('T')[0];
      this.state.caseMetadata.dvrModel = metaModel || '';

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
