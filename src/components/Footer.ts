/**
 * SyncFlow: Footer Component
 * Prominently features "Engineered by R. Hanks" and LEVA/SWGDE Forensic References
 * Engineered by R. Hanks
 */

export function renderFooter(): string {
  return `
    <footer class="border-t border-slate-800 bg-slate-950/80 mt-12 py-8 px-4 sm:px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <!-- Developer Signature & System Identity -->
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-200 text-sm">SyncFlow Forensic Systems</span>
            <span class="text-slate-600">•</span>
            <span class="text-teal-400 font-mono font-semibold text-sm">Engineered by R. Hanks</span>
          </div>
          <p class="text-slate-500 mt-1 max-w-xl">
            Principal Digital Forensics and Multimedia Engineering • Specializing in LEVA Video Forensics Protocols and SWGDE Standards for Video Acquisition and Temporal Calibration.
          </p>
        </div>

        <!-- Compliance Badges -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-[11px] font-mono">
          <span class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            SWGDE Best Practices v4.2
          </span>
          <span class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            LEVA Standard Operating Procedures
          </span>
          <span class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400">
            Air-Gapped / Zero Cloud Leakage
          </span>
        </div>
      </div>
      <div class="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-900 text-center text-[10px] text-slate-600 font-mono">
        All cryptographic operations (SHA-256), optical character recognition (Tesseract.js), and EXIF metadata extractions run 100% within the local device memory sandbox.
      </div>
    </footer>
  `;
}
