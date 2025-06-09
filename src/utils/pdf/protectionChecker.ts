
import { PDFDocument } from 'pdf-lib';

export const isProtectedPDF = async (pdfBytes: Uint8Array): Promise<boolean> => {
  try {
    console.log('Checking if PDF is protected...');
    
    // Load the PDF and check for protection metadata
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Check if it has our protection metadata
    const title = pdfDoc.getTitle();
    const subject = pdfDoc.getSubject();
    const keywords = pdfDoc.getKeywords();
    
    console.log('PDF metadata check:', { 
      title, 
      hasSubject: !!subject, 
      hasKeywords: !!keywords,
      subjectPrefix: subject?.substring(0, 20),
      keywordsLength: Array.isArray(keywords) ? keywords.length : 0
    });
    
    // Look for our protection markers
    if (title === 'Protected Document' && 
        subject?.startsWith('PROTECTED:') && 
        Array.isArray(keywords) && 
        keywords.length > 0 && 
        keywords[0]?.startsWith('CONTENT:')) {
      console.log('PDF is protected with our system');
      return true;
    }
    
    console.log('PDF is not protected with our system');
    return false;
  } catch (error) {
    console.error('Error checking PDF protection:', error);
    return false;
  }
};
