# SyncFlow: Forensic DVR Clock-Drift & Timeline Calibrator

> Part of the **[CustodyFlow](https://github.com/ryandus/custodyflow)** suite: defensible DFIR and eDiscovery workflow tools.

A client-side web application designed for digital forensic examiners to calculate CCTV temporal variance and synchronize video timelines. Engineered in compliance with LEVA video analysis protocols and SWGDE evidence recovery standards.

## 🚀 Live Deployment
**Access the live tool here:** [https://ryandus.github.io/SyncFlow/](https://ryandus.github.io/SyncFlow/)  
*(Accessible on mobile for live back-camera frame acquisition).*

## ⚖️ Forensic Architecture & Compliance
SyncFlow runs in the browser and makes no server uploads: image handling, OCR, and SHA-256 hashing all happen on your device. When the page loads it fetches Tailwind, web fonts, and three libraries (ExifReader, Tesseract.js, html2canvas) from public CDNs, and by default Tesseract.js downloads its OCR engine files from a CDN the first time it runs. The app is therefore not air-gapped. Running it with no network access would require bundling those libraries locally.

### Key Features
*   **Client-Side Processing:** Zero-server architecture. All image processing, OCR, and cryptographic hashing (SHA-256) are performed on your device, using the Web Crypto API for hashing.
*   **Reference-Time Calibration:** Derives the reference time from trusted `DateTimeOriginal` EXIF metadata in calibration photos taken with synced field devices, and calculates temporal drift ($\Delta t$) against client-side OCR DVR timestamps.
*   **Touch-Optimized ROI Cropping:** Precision crop tools with real-time contrast, grayscale, inversion, and binarization filters for clarifying degraded CCTV timestamps.
*   **Client-Side OCR (Tesseract.js):** Real-time optical character recognition optimized for dot-matrix and 7-segment CCTV fonts with regex normalization.
*   **Clock-Drift Analysis:** Calculates signed clock vectors (Δt), categorizing drift status (Fast/Slow/Synchronized), and computes quartz oscillator linear drift rates (seconds/day and PPM).
*   **Incident Timeline Synchronizer:** Converts recorded video footage timestamps into calibrated real-world chronology.
*   **Court-Ready Evidence Exhibits:** Generates standardized LEVA/SWGDE expert witness narrative statements and renders high-resolution PNG evidence cards for courtroom exhibit binders.

## 🛠️ Technology Stack
*   **Frontend:** HTML5, Tailwind CSS, Vanilla ES6 JavaScript / TypeScript
*   **Metadata Parsing:** ExifReader (DateTimeOriginal, GPS, camera hardware details)
*   **OCR Engine:** Tesseract.js
*   **Exhibit Rendering:** html2canvas

## 🖥️ Running Locally
SyncFlow is a Vite and TypeScript app. It needs Node.js and, because it loads libraries from CDNs (see above), an internet connection.
1. Clone the repository: `git clone https://github.com/ryandus/SyncFlow.git`
2. Install and start the dev server: `npm install`, then `npm run dev` (serves on port 3000).
3. To build a static copy, run `npm run build`; `npm run preview` serves the result.

Opening `index.html` directly in a browser does not work, because it loads the TypeScript source.

## 🧪 Production Casework Readiness
SyncFlow is built for direct casework intake. Examiners can immediately input case identifiers, import calibration photographs or capture live DVR monitor displays, extract timestamps via local client-side OCR, and produce calibrated courtroom exhibits with cryptographic SHA-256 integrity verification.

*Note: All generated exhibits include cryptographic hashes, EXIF hardware metadata, and embedded forensic watermarks for chain of custody verification.*

## 👨‍💻 About the Developer
**Engineered by Ryan C. Hanks**  
SyncFlow is part of the **CustodyFlow** suite of open-source diagnostic and investigative web applications, alongside **TraceFlow** and **ProdFlow**, built to streamline technical workflows and maintain rigorous analytical standards.

## 📄 License
This project is open-source and licensed under the MIT License.
