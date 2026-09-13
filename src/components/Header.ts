/**
 * SyncFlow: Header Component
 * Displays Title, Subtitle, "Engineered by R. Hanks" and Forensic Security Badges
 * Engineered by R. Hanks
 */

export function renderHeader(): string {
  return `
    <header class="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <!-- Title & Subtitle Branding -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black text-xl tracking-tighter">
            SF
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                SyncFlow
              </h1>
              <span class="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300">
                LEVA &amp; SWGDE v4.2
              </span>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                100% Local / Zero Server Uploads
              </span>
            </div>
            <p class="text-xs sm:text-sm text-slate-400 font-medium">
              Forensic DVR Clock-Drift &amp; Timeline Calibrator
            </p>
            <p class="text-[11px] text-teal-400 font-mono font-semibold tracking-wide mt-0.5">
              Engineered by R. Hanks
            </p>
          </div>
        </div>

        <!-- System & CDN Health Indicators -->
        <div class="flex items-center gap-2 text-xs font-mono flex-wrap">
          <div id="cdn-status-exif" class="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>ExifReader</span>
          </div>
          <div id="cdn-status-ocr" class="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>Tesseract.js</span>
          </div>
          <div id="cdn-status-h2c" class="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>html2canvas</span>
          </div>
          <button id="btn-header-clear-all" class="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/50 text-slate-300 hover:text-rose-300 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer" title="Reset all fields and clear example text">
            <svg class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            <span>Clear Fields</span>
          </button>
          <button id="btn-open-camera" class="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span>Live Camera</span>
          </button>
        </div>
      </div>
    </header>
  `;
}
