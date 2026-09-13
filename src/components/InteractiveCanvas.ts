/**
 * SyncFlow: Mobile-First Interactive ROI Crop & Preprocessing Canvas
 * Features Touch drag, Corner resize, Preprocessing filters, and Watermarking
 * Engineered by R. Hanks
 */

import { CropROI, PreprocessOptions } from '../types';
import { applyCanvasWatermark } from '../utils/watermark';
import { preprocessCanvas } from '../utils/ocrEngine';

export class InteractiveCropCanvas {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previewCanvas: HTMLCanvasElement;
  private image: HTMLImageElement | null = null;

  // ROI in image coordinates
  private roi: CropROI = { x: 50, y: 50, width: 300, height: 80 };

  // Canvas display transform
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  // Interaction state
  private isDragging = false;
  private activeHandle: 'body' | 'nw' | 'ne' | 'sw' | 'se' | null = null;
  private startPoint = { x: 0, y: 0 };
  private startRoi: CropROI = { x: 0, y: 0, width: 0, height: 0 };

  // Preprocessing options
  private preprocess: PreprocessOptions = {
    grayscale: true,
    invert: false,
    contrast: 135,
    brightness: 10,
    threshold: 0,
  };

  private onRoiChanged: (croppedCanvas: HTMLCanvasElement, preprocessedCanvas: HTMLCanvasElement) => void;

  constructor(
    containerId: string,
    onRoiChanged: (croppedCanvas: HTMLCanvasElement, preprocessedCanvas: HTMLCanvasElement) => void
  ) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.onRoiChanged = onRoiChanged;

    this.renderDOM();
    this.canvas = this.container.querySelector('#main-crop-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.previewCanvas = this.container.querySelector('#roi-preview-canvas') as HTMLCanvasElement;

    this.bindEvents();
    this.bindFilterControls();
  }

  private renderDOM() {
    this.container.innerHTML = `
      <div class="flex flex-col gap-4">
        <!-- Canvas Stage & Toolbar -->
        <div class="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
          <!-- Top Tool Bar -->
          <div class="bg-slate-900/80 px-3 py-2 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div class="flex items-center gap-1.5 text-slate-300">
              <span class="w-2 h-2 rounded-full bg-teal-400"></span>
              <span class="font-semibold text-slate-200">OSD Clock ROI Bounding Box</span>
              <span class="text-slate-500 hidden sm:inline">• Drag box or corners to frame DVR time</span>
            </div>

            <!-- Mobile Position Presets -->
            <div class="flex items-center gap-1">
              <span class="text-[10px] text-slate-400 uppercase tracking-wider mr-1 hidden xs:inline">Presets:</span>
              <button id="btn-preset-tr" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition">
                Top-R
              </button>
              <button id="btn-preset-tl" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition">
                Top-L
              </button>
              <button id="btn-preset-br" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition">
                Btm-R
              </button>
              <button id="btn-preset-bl" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition">
                Btm-L
              </button>
              <button id="btn-reset-zoom" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 text-[11px] transition ml-1" title="Fit to screen">
                Fit View
              </button>
            </div>
          </div>

          <!-- Canvas Viewport -->
          <div id="canvas-viewport" class="relative w-full h-[340px] sm:h-[420px] bg-slate-950 flex items-center justify-center overflow-hidden cursor-crosshair select-none touch-none">
            <canvas id="main-crop-canvas" class="max-w-full max-h-full block"></canvas>
            
            <!-- Watermark corner indicator -->
            <div class="absolute bottom-2 left-2 pointer-events-none text-[10px] font-mono text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/40">
              SyncFlow | Engineered by R. Hanks
            </div>

            <!-- Touch Hint for Mobile -->
            <div id="mobile-touch-hint" class="absolute top-2 left-2 pointer-events-none text-[10px] font-mono text-teal-400/80 bg-slate-900/80 px-2 py-1 rounded border border-teal-500/20 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
              </svg>
              <span>Touch / drag teal box over DVR clock</span>
            </div>
          </div>
        </div>

        <!-- Real-Time Crop & Preprocessing Controls -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <!-- Live Cropped Thumbnail & Preprocessing Preview -->
          <div class="md:col-span-5 flex flex-col justify-between gap-2 border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                OCR Input Buffer Preview
              </span>
              <span class="text-[10px] font-mono text-slate-400" id="roi-dimensions">0 x 0 px</span>
            </div>
            
            <div class="bg-black border border-slate-700 rounded-lg p-2 min-h-[90px] flex items-center justify-center overflow-hidden">
              <canvas id="roi-preview-canvas" class="max-w-full max-h-[80px] object-contain"></canvas>
            </div>
            <p class="text-[10px] text-slate-400 font-mono">
              Optimized for 7-segment LED, dot-matrix, and low-contrast DVR on-screen text.
            </p>
          </div>

          <!-- Forensic Enhancement Filters -->
          <div class="md:col-span-7 flex flex-col justify-between gap-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="text-xs font-mono font-semibold text-slate-300">Forensic OCR Preprocessing Filters</span>
              <button id="btn-reset-filters" class="text-[11px] font-mono text-teal-400 hover:text-teal-300">
                Reset Filters
              </button>
            </div>

            <!-- Toggles: Grayscale & Invert -->
            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <label class="flex items-center gap-2 p-2 rounded bg-slate-800/80 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <input type="checkbox" id="filter-grayscale" checked class="rounded border-slate-600 text-teal-500 focus:ring-teal-400" />
                <span class="text-slate-200">Grayscale Boost</span>
              </label>

              <label class="flex items-center gap-2 p-2 rounded bg-slate-800/80 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <input type="checkbox" id="filter-invert" class="rounded border-slate-600 text-teal-500 focus:ring-teal-400" />
                <span class="text-slate-200">Invert Colors (B/W)</span>
              </label>
            </div>

            <!-- Sliders: Contrast & Threshold -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div class="flex flex-col gap-1">
                <div class="flex justify-between text-slate-400 text-[11px]">
                  <span>Contrast Boost</span>
                  <span id="val-contrast">135%</span>
                </div>
                <input type="range" id="slider-contrast" min="50" max="250" value="135" class="accent-teal-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer" />
              </div>

              <div class="flex flex-col gap-1">
                <div class="flex justify-between text-slate-400 text-[11px]">
                  <span>Binarize / Threshold</span>
                  <span id="val-threshold">Auto</span>
                </div>
                <input type="range" id="slider-threshold" min="0" max="255" value="0" class="accent-teal-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  public setImage(img: HTMLImageElement, initialRoi?: CropROI) {
    this.image = img;

    // Reset or set ROI
    if (initialRoi) {
      this.roi = { ...initialRoi };
    } else {
      // Default to top-right corner where 80% of CCTV clocks sit
      const rw = Math.round(img.naturalWidth * 0.35);
      const rh = Math.round(img.naturalHeight * 0.12);
      this.roi = {
        x: Math.max(10, img.naturalWidth - rw - 20),
        y: 20,
        width: Math.min(rw, img.naturalWidth - 40),
        height: Math.max(40, rh),
      };
    }

    this.fitCanvasToContainer();
    this.draw();
    this.updatePreviewAndEmit();
  }

  private fitCanvasToContainer() {
    if (!this.image) return;

    const viewport = this.container.querySelector('#canvas-viewport') as HTMLElement;
    const vWidth = viewport.clientWidth || 600;
    const vHeight = viewport.clientHeight || 360;

    const imgW = this.image.naturalWidth;
    const imgH = this.image.naturalHeight;

    const scaleX = vWidth / imgW;
    const scaleY = vHeight / imgH;
    this.scale = Math.min(scaleX, scaleY, 1.0);

    this.canvas.width = Math.round(imgW * this.scale);
    this.canvas.height = Math.round(imgH * this.scale);

    this.offsetX = 0;
    this.offsetY = 0;
  }

  private draw() {
    if (!this.image) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw source image scaled
    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

    // 2. Dim area outside ROI
    this.ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 3. Clear ROI inside (reveal full brightness)
    const rx = this.roi.x * this.scale;
    const ry = this.roi.y * this.scale;
    const rw = this.roi.width * this.scale;
    const rh = this.roi.height * this.scale;

    this.ctx.clearRect(rx, ry, rw, rh);
    this.ctx.drawImage(
      this.image,
      this.roi.x,
      this.roi.y,
      this.roi.width,
      this.roi.height,
      rx,
      ry,
      rw,
      rh
    );

    // 4. Draw ROI Bounding Box Border (Forensic Teal & Amber)
    this.ctx.strokeStyle = '#2dd4bf'; // teal-400
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(rx, ry, rw, rh);

    // Dotted inner crosshair line
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeStyle = 'rgba(45, 212, 191, 0.4)';
    this.ctx.beginPath();
    this.ctx.moveTo(rx, ry + rh / 2);
    this.ctx.lineTo(rx + rw, ry + rh / 2);
    this.ctx.moveTo(rx + rw / 2, ry);
    this.ctx.lineTo(rx + rw / 2, ry + rh);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // reset

    // 5. Draw Corner Drag Handles (Minimum 44px touch-friendly hit areas, visual 12px squares)
    const handleSize = 10;
    this.ctx.fillStyle = '#14b8a6'; // teal-500
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;

    const corners = [
      { x: rx, y: ry }, // NW
      { x: rx + rw, y: ry }, // NE
      { x: rx, y: ry + rh }, // SW
      { x: rx + rw, y: ry + rh }, // SE
    ];

    corners.forEach(c => {
      this.ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      this.ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    });

    // 6. Draw ROI Label badge
    this.ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    this.ctx.fillRect(rx, Math.max(0, ry - 22), 160, 20);
    this.ctx.fillStyle = '#2dd4bf';
    this.ctx.font = '600 11px "JetBrains Mono", monospace';
    this.ctx.fillText('DVR CLOCK ROI', rx + 6, Math.max(14, ry - 8));

    // 7. Apply subtle non-intrusive watermark to canvas
    applyCanvasWatermark(this.ctx, this.canvas.width, this.canvas.height, 'corner');
  }

  private updatePreviewAndEmit() {
    if (!this.image) return;

    // Create a temporary canvas for the exact crop in native image resolution
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.max(10, Math.round(this.roi.width));
    cropCanvas.height = Math.max(10, Math.round(this.roi.height));
    const cropCtx = cropCanvas.getContext('2d')!;

    cropCtx.drawImage(
      this.image,
      this.roi.x,
      this.roi.y,
      this.roi.width,
      this.roi.height,
      0,
      0,
      cropCanvas.width,
      cropCanvas.height
    );

    // Apply preprocessing filters for OCR
    const preprocessedCanvas = preprocessCanvas(cropCanvas, this.preprocess);

    // Render into preview UI
    this.previewCanvas.width = preprocessedCanvas.width;
    this.previewCanvas.height = preprocessedCanvas.height;
    const pCtx = this.previewCanvas.getContext('2d')!;
    pCtx.drawImage(preprocessedCanvas, 0, 0);

    // Update dimensions display
    const dimEl = this.container.querySelector('#roi-dimensions');
    if (dimEl) {
      dimEl.textContent = `${cropCanvas.width} × ${cropCanvas.height} px`;
    }

    this.onRoiChanged(cropCanvas, preprocessedCanvas);
  }

  private bindEvents() {
    const viewport = this.container.querySelector('#canvas-viewport') as HTMLElement;

    // Preset buttons
    this.container.querySelector('#btn-preset-tr')?.addEventListener('click', () => this.applyPreset('top-right'));
    this.container.querySelector('#btn-preset-tl')?.addEventListener('click', () => this.applyPreset('top-left'));
    this.container.querySelector('#btn-preset-br')?.addEventListener('click', () => this.applyPreset('bottom-right'));
    this.container.querySelector('#btn-preset-bl')?.addEventListener('click', () => this.applyPreset('bottom-left'));
    this.container.querySelector('#btn-reset-zoom')?.addEventListener('click', () => {
      this.fitCanvasToContainer();
      this.draw();
    });

    // Window resize listener
    window.addEventListener('resize', () => {
      if (this.image) {
        this.fitCanvasToContainer();
        this.draw();
      }
    });

    // Pointer events (unifies Mouse & Touch)
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    window.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    window.addEventListener('pointerup', () => this.handlePointerUp());
    window.addEventListener('pointercancel', () => this.handlePointerUp());
  }

  private getCanvasPoint(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top),
    };
  }

  private handlePointerDown(e: PointerEvent) {
    if (!this.image) return;

    this.canvas.setPointerCapture(e.pointerId);
    const pt = this.getCanvasPoint(e);

    const rx = this.roi.x * this.scale;
    const ry = this.roi.y * this.scale;
    const rw = this.roi.width * this.scale;
    const rh = this.roi.height * this.scale;

    const hitRadius = 24; // Generous touch hit area for mobile fingertips

    // Check corner handles
    if (Math.hypot(pt.x - rx, pt.y - ry) < hitRadius) {
      this.activeHandle = 'nw';
    } else if (Math.hypot(pt.x - (rx + rw), pt.y - ry) < hitRadius) {
      this.activeHandle = 'ne';
    } else if (Math.hypot(pt.x - rx, pt.y - (ry + rh)) < hitRadius) {
      this.activeHandle = 'sw';
    } else if (Math.hypot(pt.x - (rx + rw), pt.y - (ry + rh)) < hitRadius) {
      this.activeHandle = 'se';
    } else if (pt.x >= rx && pt.x <= rx + rw && pt.y >= ry && pt.y <= ry + rh) {
      this.activeHandle = 'body';
    } else {
      // Tap outside moves ROI center to point
      const imgX = pt.x / this.scale;
      const imgY = pt.y / this.scale;
      this.roi.x = Math.max(0, Math.min(this.image.naturalWidth - this.roi.width, imgX - this.roi.width / 2));
      this.roi.y = Math.max(0, Math.min(this.image.naturalHeight - this.roi.height, imgY - this.roi.height / 2));
      this.activeHandle = 'body';
    }

    this.isDragging = true;
    this.startPoint = pt;
    this.startRoi = { ...this.roi };

    this.draw();
  }

  private handlePointerMove(e: PointerEvent) {
    if (!this.isDragging || !this.image) return;

    const pt = this.getCanvasPoint(e);
    const dxImg = (pt.x - this.startPoint.x) / this.scale;
    const dyImg = (pt.y - this.startPoint.y) / this.scale;

    const maxW = this.image.naturalWidth;
    const maxH = this.image.naturalHeight;

    if (this.activeHandle === 'body') {
      let nx = this.startRoi.x + dxImg;
      let ny = this.startRoi.y + dyImg;
      nx = Math.max(0, Math.min(maxW - this.roi.width, nx));
      ny = Math.max(0, Math.min(maxH - this.roi.height, ny));
      this.roi.x = Math.round(nx);
      this.roi.y = Math.round(ny);
    } else if (this.activeHandle === 'se') {
      let nw = Math.max(40, this.startRoi.width + dxImg);
      let nh = Math.max(20, this.startRoi.height + dyImg);
      nw = Math.min(maxW - this.roi.x, nw);
      nh = Math.min(maxH - this.roi.y, nh);
      this.roi.width = Math.round(nw);
      this.roi.height = Math.round(nh);
    } else if (this.activeHandle === 'sw') {
      let nx = Math.max(0, this.startRoi.x + dxImg);
      let nw = this.startRoi.width - (nx - this.startRoi.x);
      if (nw > 40) {
        this.roi.x = Math.round(nx);
        this.roi.width = Math.round(nw);
      }
      let nh = Math.max(20, Math.min(maxH - this.roi.y, this.startRoi.height + dyImg));
      this.roi.height = Math.round(nh);
    } else if (this.activeHandle === 'ne') {
      let ny = Math.max(0, this.startRoi.y + dyImg);
      let nh = this.startRoi.height - (ny - this.startRoi.y);
      if (nh > 20) {
        this.roi.y = Math.round(ny);
        this.roi.height = Math.round(nh);
      }
      let nw = Math.max(40, Math.min(maxW - this.roi.x, this.startRoi.width + dxImg));
      this.roi.width = Math.round(nw);
    } else if (this.activeHandle === 'nw') {
      let nx = Math.max(0, this.startRoi.x + dxImg);
      let nw = this.startRoi.width - (nx - this.startRoi.x);
      let ny = Math.max(0, this.startRoi.y + dyImg);
      let nh = this.startRoi.height - (ny - this.startRoi.y);
      if (nw > 40) {
        this.roi.x = Math.round(nx);
        this.roi.width = Math.round(nw);
      }
      if (nh > 20) {
        this.roi.y = Math.round(ny);
        this.roi.height = Math.round(nh);
      }
    }

    this.draw();
    this.updatePreviewAndEmit();
  }

  private handlePointerUp() {
    this.isDragging = false;
    this.activeHandle = null;
  }

  private applyPreset(position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') {
    if (!this.image) return;

    const imgW = this.image.naturalWidth;
    const imgH = this.image.naturalHeight;
    const rw = Math.round(imgW * 0.35);
    const rh = Math.round(imgH * 0.12);

    this.roi.width = rw;
    this.roi.height = rh;

    if (position === 'top-right') {
      this.roi.x = imgW - rw - 20;
      this.roi.y = 20;
    } else if (position === 'top-left') {
      this.roi.x = 20;
      this.roi.y = 20;
    } else if (position === 'bottom-right') {
      this.roi.x = imgW - rw - 20;
      this.roi.y = imgH - rh - 20;
    } else if (position === 'bottom-left') {
      this.roi.x = 20;
      this.roi.y = imgH - rh - 20;
    }

    this.draw();
    this.updatePreviewAndEmit();
  }

  private bindFilterControls() {
    const chkGray = this.container.querySelector('#filter-grayscale') as HTMLInputElement;
    const chkInvert = this.container.querySelector('#filter-invert') as HTMLInputElement;
    const sliderContrast = this.container.querySelector('#slider-contrast') as HTMLInputElement;
    const sliderThreshold = this.container.querySelector('#slider-threshold') as HTMLInputElement;
    const valContrast = this.container.querySelector('#val-contrast') as HTMLElement;
    const valThreshold = this.container.querySelector('#val-threshold') as HTMLElement;

    chkGray?.addEventListener('change', () => {
      this.preprocess.grayscale = chkGray.checked;
      this.updatePreviewAndEmit();
    });

    chkInvert?.addEventListener('change', () => {
      this.preprocess.invert = chkInvert.checked;
      this.updatePreviewAndEmit();
    });

    sliderContrast?.addEventListener('input', () => {
      const val = parseInt(sliderContrast.value, 10);
      this.preprocess.contrast = val;
      valContrast.textContent = `${val}%`;
      this.updatePreviewAndEmit();
    });

    sliderThreshold?.addEventListener('input', () => {
      const val = parseInt(sliderThreshold.value, 10);
      this.preprocess.threshold = val;
      valThreshold.textContent = val === 0 ? 'Auto' : `${val}`;
      this.updatePreviewAndEmit();
    });

    this.container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
      this.preprocess = {
        grayscale: true,
        invert: false,
        contrast: 135,
        brightness: 10,
        threshold: 0,
      };
      chkGray.checked = true;
      chkInvert.checked = false;
      sliderContrast.value = '135';
      sliderThreshold.value = '0';
      valContrast.textContent = '135%';
      valThreshold.textContent = 'Auto';
      this.updatePreviewAndEmit();
    });
  }

  public clearImage() {
    this.image = null;
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#020617';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid pattern and prompt
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 32) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 32) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    this.ctx.font = 'bold 13px JetBrains Mono, monospace';
    this.ctx.fillStyle = '#64748b';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('NO EVIDENCE LOADED • AWAITING DVR FRAME', this.canvas.width / 2, this.canvas.height / 2 - 8);
    this.ctx.font = '11px JetBrains Mono, monospace';
    this.ctx.fillStyle = '#475569';
    this.ctx.fillText('Drop image file, use Camera, or select an Example Case Study above', this.canvas.width / 2, this.canvas.height / 2 + 14);

    const previewCanvas = this.container.querySelector('#roi-preview-canvas') as HTMLCanvasElement;
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        previewCanvas.width = 240;
        previewCanvas.height = 60;
        pCtx.fillStyle = '#020617';
        pCtx.fillRect(0, 0, 240, 60);
        pCtx.font = '10px JetBrains Mono, monospace';
        pCtx.fillStyle = '#475569';
        pCtx.textAlign = 'center';
        pCtx.fillText('No active crop buffer', 120, 35);
      }
    }
    const dimEl = this.container.querySelector('#roi-dimensions');
    if (dimEl) dimEl.textContent = '0 x 0 px';
  }

  public getRoi(): CropROI {
    return { ...this.roi };
  }

  public getPreprocess(): PreprocessOptions {
    return { ...this.preprocess };
  }
}
