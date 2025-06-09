
import { PDFDocument } from 'pdf-lib';
import { decryptContent, convertFromBase64Safely } from './encryption';

export const unlockPDF = async (
  encryptedPdfBytes: Uint8Array, 
  password: string
): Promise<Uint8Array | null> => {
  try {
    console.log('Attempting to unlock PDF...');
    
    // Load the wrapper PDF
    const wrapperDoc = await PDFDocument.load(encryptedPdfBytes);
    
    // Get the protection information from metadata
    const title = wrapperDoc.getTitle();
    const subject = wrapperDoc.getSubject();
    const keywords = wrapperDoc.getKeywords();
    
    if (title !== 'Protected Document' || 
        !subject?.startsWith('PROTECTED:') || 
        !Array.isArray(keywords) || 
        keywords.length === 0 || 
        !keywords[0]?.startsWith('CONTENT:')) {
      throw new Error('PDF is not protected with our system');
    }
    
    // Extract and verify the password
    const storedPasswordHash = subject.split('PROTECTED:')[1];
    const passwordHash = Array.from(new TextEncoder().encode(password))
      .reduce((hash, byte) => ((hash << 5) - hash + byte) & 0xffffffff, 0)
      .toString(16);
    
    if (passwordHash !== storedPasswordHash) {
      console.log('Incorrect password provided');
      return null; // Incorrect password
    }
    
    console.log('Password verified, decrypting content...');
    
    // Extract the encrypted content
    const base64EncryptedContent = keywords[0].split('CONTENT:')[1];
    
    // Convert base64 back to encrypted content safely
    const encryptedContent = convertFromBase64Safely(base64EncryptedContent);
    
    // Decrypt the original PDF content
    const decryptedContent = decryptContent(encryptedContent, password);
    
    console.log('PDF unlocked successfully');
    
    return decryptedContent;
    
  } catch (error) {
    console.error('Failed to unlock PDF:', error);
    const errorMessage = (error as Error).message.toLowerCase();
    
    if (errorMessage.includes('not protected') || errorMessage.includes('password')) {
      console.log('Password verification failed or PDF not protected');
      return null; // Incorrect password or not protected
    }
    
    throw error; // Other error
  }
};
