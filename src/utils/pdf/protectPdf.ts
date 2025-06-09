
import { ProtectionOptions } from './types';
import { encryptContent, convertToBase64Safely } from './encryption';
import { createProtectionWrapperDocument } from './wrapperDocument';

export const protectPDFWithPassword = async (
  pdfBytes: Uint8Array, 
  options: ProtectionOptions
): Promise<Uint8Array> => {
  try {
    console.log('Starting PDF protection process...');
    
    console.log('Encrypting PDF content...');
    
    // Encrypt the original PDF content
    const encryptedContent = encryptContent(pdfBytes, options.userPassword);
    
    // Convert encrypted content to base64 safely
    const base64Content = convertToBase64Safely(encryptedContent);
    
    // Create wrapper document with encrypted content
    const protectedPdfBytes = await createProtectionWrapperDocument(base64Content, options.userPassword);
    
    return protectedPdfBytes;
    
  } catch (error) {
    console.error('Error protecting PDF:', error);
    throw new Error('Failed to protect PDF: ' + (error as Error).message);
  }
};
