/**
 * Runtime capability identifiers.
 *
 * Each capability maps to a browser API or runtime feature.
 * Tools declare which capabilities they require; the ToolRegistry
 * only loads tools whose requirements are fully satisfied.
 */
export type Capability =
  | 'indexeddb'        // IndexedDB persistence
  | 'fetch'            // Fetch API (network requests)
  | 'clipboard'        // Clipboard read/write
  | 'notifications'    // Notification API
  | 'canvas'           // Canvas 2D rendering
  | 'web-worker'       // Web Workers
  | 'service-worker'   // Service Worker
  | 'webrtc'           // WebRTC
  | 'geolocation'      // Geolocation API
  | 'speech'           // SpeechSynthesis / SpeechRecognition
  | 'local-storage'    // localStorage
  | 'session-storage'  // sessionStorage
  | 'js-eval'          // JavaScript execution (always true in browser)
  | 'dom'              // DOM manipulation
  | 'css'              // CSS styling / CSSOM
  | 'media-devices'    // Camera / Microphone
  | 'visibility'       // Page Visibility API
  | 'crypto'           // Web Crypto API
  ;

export type RuntimeType = 'browser' | 'node' | 'worker' | 'unknown';

export interface RuntimeProfile {
  /** What kind of runtime this is. */
  type: RuntimeType;
  /** Human-readable name, e.g. "Chrome 124", "Firefox 130". */
  userAgent: string;
  /** Set of detected capabilities. */
  capabilities: Set<Capability>;
  /** Things this runtime explicitly CANNOT do. */
  limitations: string[];
  /** Approximate memory limit in MB (if detectable). */
  memoryMB: number | null;
  /** Is this a mobile device? */
  mobile: boolean;
  /** Is the page currently visible? */
  visible: boolean;
  /** Screen dimensions (if in browser). */
  screen: { width: number; height: number } | null;
}
