# SyncFlow: Forensic DVR Clock-Drift & Timeline Calibrator

A client-side, air-gapped web application designed for digital forensic examiners to calculate CCTV temporal variance and synchronize video timelines. Engineered in compliance with LEVA video analysis protocols and SWGDE evidence recovery standards.

## 🚀 Live Deployment
**Access the live tool here:** [https://ryandus.github.io/SyncFlow/](https://ryandus.github.io/SyncFlow/)  
*(Accessible on mobile for live back-camera frame acquisition).*

## ⚖️ Forensic Architecture & Compliance
SyncFlow is built to operate in strict, isolated environments. The application executes 100% locally in the browser with zero server uploads, ensuring cryptographic chain-of-custody and data integrity for sensitive case files. 

### Key Features
*   **Air-Gapped Processing:** Zero-server architecture. All image processing, OCR, and cryptographic hashing (SHA-256) are performed entirely client-side using the Web Crypto API.
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

## 🖥️ Local Offline Execution
Since SyncFlow is entirely client-side, it can also be run locally without an internet connection.
1. Clone the repository: `git clone https://github.com/ryandus/SyncFlow.git`
2. Open `index.html` directly in any modern web browser. No local server required for core functionality.

## 🧪 Demonstration & Benchmarking
SyncFlow ships with built-in authentic test cases (Hikvision, Dahua, and Hanwha Wisenet) to validate the calibration math and OCR engines. 

*Note: All benchmark demonstration cards are dynamically watermarked to ensure demonstration reports are never confused with live courtroom casework.*

## 👨‍💻 About the Developer
**Engineered by Ryan Hanks**  
SyncFlow joins a suite of open-source diagnostic and investigative web applications—including **TriageFlow**, **TraceFlow**, and the **Police Report Generator**—built to streamline technical workflows and maintain rigorous analytical standards.

## 📄 License
This project is open-source and licensed under the MIT License.