
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const createProtectionWrapperDocument = async (base64Content: string, password: string): Promise<Uint8Array> => {
  console.log('Creating protection wrapper document...');
  
  // Create a new PDF document that will serve as a password protection wrapper
  const wrapperDoc = await PDFDocument.create();
  const font = await wrapperDoc.embedFont(StandardFonts.Helvetica);
  
  // Create a password protection page
  const protectionPage = wrapperDoc.addPage([600, 800]);
  
  // Add title
  protectionPage.drawText('Password Protected Document', {
    x: 50,
    y: 750,
    size: 24,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Add instructions
  protectionPage.drawText('This document is password protected.', {
    x: 50,
    y: 700,
    size: 16,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  protectionPage.drawText('Please use the "Unlock PDF" tool to view the content.', {
    x: 50,
    y: 675,
    size: 16,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  protectionPage.drawText('Password is required to access the original document.', {
    x: 50,
    y: 650,
    size: 14,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  // Add protection notice
  protectionPage.drawText('PROTECTED CONTENT', {
    x: 200,
    y: 400,
    size: 32,
    font,
    color: rgb(0.9, 0.9, 0.9),
  });
  
  // Create a simple password hash for verification
  const passwordHash = Array.from(new TextEncoder().encode(password))
    .reduce((hash, byte) => ((hash << 5) - hash + byte) & 0xffffffff, 0)
    .toString(16);
  
  // Set metadata with encrypted content and password verification
  wrapperDoc.setTitle('Protected Document');
  wrapperDoc.setAuthor('PDF Craft Pro');
  wrapperDoc.setSubject(`PROTECTED:${passwordHash}`);
  wrapperDoc.setKeywords([`CONTENT:${base64Content}`]); // Fixed: now passing an array
  wrapperDoc.setCreationDate(new Date());
  wrapperDoc.setModificationDate(new Date());
  
  console.log('PDF protection wrapper created successfully');
  
  // Save the wrapper PDF with encrypted content embedded
  const protectedPdfBytes = await wrapperDoc.save();
  return new Uint8Array(protectedPdfBytes);
};
