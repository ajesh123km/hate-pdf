
// Re-export all functionality from the modular components
export type { ProtectionOptions } from './pdf/types';
export { protectPDFWithPassword } from './pdf/protectPdf';
export { unlockPDF } from './pdf/unlockPdf';
export { isProtectedPDF } from './pdf/protectionChecker';
