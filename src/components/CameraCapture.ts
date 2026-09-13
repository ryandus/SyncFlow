/**
 * SyncFlow: Mobile Camera Capture Component
 * Accesses mobile high-res rear camera to snapshot DVR On-Screen Display
 * Computes client-side SHA-256 and captures device shutter timestamp
 * Engineered by R. Hanks
 */

export class CameraCaptureModal {
  private container: HTMLElement;
  private videoEl: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private onCaptureCallback: (blob: Blob, timestamp: Date) => void;

  constructor(onCapture: (blob: Blob, timestamp: Date) => void) {
    this.onCaptureCallback = onCapture;
    this.container = document.createElement('div');
    this.container.id = 'camera-modal';
    this.container.className = 'fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm hidden flex-col items-center justify-center p-4';
    this.render();
    document.body.appendChild(this.container);
  }

  private render() {
    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-white text-base flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Live Forensic Camera Acquisition
            </h3>
            <p class="text-xs text-slate-400">Aim at DVR monitor OSD clock • Captures frame with subsecond timestamp</p>
          </div>
          <button id="btn-close-camera" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Video Stream Container -->
        <div class="relative bg-black flex-1 min-h-[320px] flex items-center justify-center overflow-hidden">
          <video id="camera-feed" autoplay playsinline muted class="w-full h-full object-contain"></video>

          <!-- Framing Guide Overlay -->
          <div class="absolute inset-0 pointer-events-none border-2 border-teal-500/40 m-6 rounded-lg flex flex-col justify-between p-3">
            <div class="flex justify-between text-[11px] font-mono text-teal-400/80 bg-slate-950/60 px-2 py-1 rounded w-fit">
              <span>Align DVR OSD Clock inside box</span>
            </div>
            <div class="flex justify-between text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded">
              <span id="camera-live-clock">--:--:--</span>
              <span>SyncFlow | R. Hanks</span>
            </div>
          </div>

          <!-- Flash Overlay -->
          <div id="camera-flash" class="absolute inset-0 bg-white opacity-0 pointer-events-none transition-opacity duration-150"></div>
        </div>

        <!-- Capture Controls -->
        <div class="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
          <button id="btn-switch-camera" class="px-3 py-2 text-xs font-mono rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Flip Lens</span>
          </button>

          <button id="btn-capture-frame" class="px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-teal-500/30 flex items-center gap-2 transition">
            <span class="w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center">
              <span class="w-2 h-2 rounded-full bg-slate-950"></span>
            </span>
            <span>CAPTURE CALIBRATION FRAME</span>
          </button>

          <button id="btn-cancel-camera" class="px-3 py-2 text-xs font-mono rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
            Cancel
          </button>
        </div>
      </div>
    `;

    // Bind event listeners
    this.container.querySelector('#btn-close-camera')?.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-cancel-camera')?.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-capture-frame')?.addEventListener('click', () => this.capture());
    this.container.querySelector('#btn-switch-camera')?.addEventListener('click', () => this.switchCamera());
  }

  private currentFacing: 'environment' | 'user' = 'environment';
  private clockTimer: any = null;

  public async open() {
    this.container.classList.remove('hidden');
    this.container.classList.add('flex');
    this.videoEl = this.container.querySelector('#camera-feed') as HTMLVideoElement;

    this.startLiveClock();
    await this.startStream();
  }

  private startLiveClock() {
    const clockEl = this.container.querySelector('#camera-live-clock');
    if (!clockEl) return;
    this.clockTimer = setInterval(() => {
      const now = new Date();
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      clockEl.textContent = now.toTimeString().split(' ')[0] + '.' + ms;
    }, 50);
  }

  private async startStream() {
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.currentFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (this.videoEl) {
        this.videoEl.srcObject = this.stream;
      }
    } catch (err) {
      console.warn('SyncFlow: Camera access failed or denied:', err);
      alert('Camera access could not be initialized. You may also upload any photo file directly or select a forensic demo case.');
      this.close();
    }
  }

  private async switchCamera() {
    this.currentFacing = this.currentFacing === 'environment' ? 'user' : 'environment';
    await this.startStream();
  }

  private capture() {
    if (!this.videoEl || !this.videoEl.videoWidth) return;

    const captureTimestamp = new Date();

    // Trigger visual flash
    const flash = this.container.querySelector('#camera-flash') as HTMLElement;
    if (flash) {
      flash.style.opacity = '0.9';
      setTimeout(() => { flash.style.opacity = '0'; }, 150);
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.videoEl.videoWidth;
    canvas.height = this.videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(this.videoEl, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        this.onCaptureCallback(blob, captureTimestamp);
        this.close();
      }
    }, 'image/jpeg', 0.95);
  }

  public close() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.container.classList.add('hidden');
    this.container.classList.remove('flex');
  }
}
