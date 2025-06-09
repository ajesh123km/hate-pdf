
import CryptoJS from 'crypto-js';

export interface EncryptionOptions {
  password: string;
  permissions: {
    printing: boolean;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
  };
}

export const encryptPDFBytes = (pdfBytes: Uint8Array, options: EncryptionOptions): Uint8Array => {
  // Convert PDF bytes to base64 for encryption
  const base64PDF = btoa(String.fromCharCode(...pdfBytes));
  
  // Create encryption metadata
  const metadata = {
    permissions: options.permissions,
    timestamp: Date.now(),
    version: '1.0'
  };
  
  // Combine PDF data with metadata
  const dataToEncrypt = {
    pdfData: base64PDF,
    metadata: metadata
  };
  
  // Encrypt the combined data using AES
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(dataToEncrypt), 
    options.password
  ).toString();
  
  // Create a wrapper structure that identifies this as an encrypted PDF
  const encryptedPDFStructure = {
    type: 'encrypted-pdf',
    version: '1.0',
    data: encrypted,
    hint: 'This PDF is password protected'
  };
  
  // Convert the encrypted structure to bytes
  const encryptedString = JSON.stringify(encryptedPDFStructure);
  const encoder = new TextEncoder();
  return encoder.encode(encryptedString);
};

export const decryptPDFBytes = (encryptedBytes: Uint8Array, password: string): Uint8Array | null => {
  try {
    // Convert bytes back to string
    const decoder = new TextDecoder();
    const encryptedString = decoder.decode(encryptedBytes);
    
    // Parse the encrypted structure
    const encryptedStructure = JSON.parse(encryptedString);
    
    if (encryptedStructure.type !== 'encrypted-pdf') {
      throw new Error('Invalid encrypted PDF format');
    }
    
    // Decrypt the data
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedStructure.data, password);
    const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Invalid password');
    }
    
    // Parse the decrypted data
    const decryptedData = JSON.parse(decryptedString);
    
    // Convert base64 back to bytes
    const binaryString = atob(decryptedData.pdfData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

export const isEncryptedPDF = (bytes: Uint8Array): boolean => {
  try {
    const decoder = new TextDecoder();
    const content = decoder.decode(bytes);
    const parsed = JSON.parse(content);
    return parsed.type === 'encrypted-pdf';
  } catch {
    return false;
  }
};
