# ZK-Camera Frontend

A production-ready Vite + React dashboard for orchestrating the ZK-Camera authenticity workflow. It guides analysts through uploading an image, extracting metadata, generating a zero-knowledge proof, and verifying authenticity against a backend service.

## Features

- ⚡️ Vite-powered React 18 application with modular components
- 🎨 Tailwind CSS dark-mode dashboard with progress tracking
- 🔒 Axios-powered REST integration for metadata, proof, and verification endpoints
- 🌀 Framer Motion micro-interactions and Lucide iconography
- 📄 Collapsible manifest viewer and real-time status cards

## Prerequisites

- Node.js 18+
- A running ZK-Camera backend exposing the following endpoints:
  - `POST /extract-metadata`
  - `POST /generate-proof`
  - `POST /verify`

## Setup

```powershell
cd zk-camera-frontend
npm install
```

Create a `.env` file (optional) to override the backend base URL:

```bash
VITE_API_BASE_URL=https://zk-camera.example.com
```

## Development

```powershell
npm run dev
```

## Production Build

```powershell
npm run build
npm run preview
```

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL for the backend REST API | `http://localhost:4000` |

## Project Structure

```
zk-camera-frontend/
├─ src/
│  ├─ components/
│  │  ├─ UploadSection.jsx
│  │  ├─ MetadataDisplay.jsx
│  │  ├─ ProofGenerator.jsx
│  │  ├─ Verifier.jsx
│  │  └─ ResultCard.jsx
│  ├─ App.jsx
│  ├─ api.js
│  ├─ index.css
│  └─ main.jsx
├─ index.html
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
└─ vite.config.js
```

## Notes

- The UI expects the backend to respond with JSON payloads matching the documented workflow. Adjust `src/api.js` if your payloads differ. 
- Tailwind directives are compiled at build time by Vite.
