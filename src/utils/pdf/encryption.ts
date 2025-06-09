
// Improved encryption functions for PDF content
export const encryptContent = (content: Uint8Array, password: string): Uint8Array => {
  console.log('Starting content encryption...');
  
  // Create a more robust key from password
  const keyBytes = new TextEncoder().encode(password);
  const key = new Uint8Array(256);
  
  // Initialize key array
  for (let i = 0; i < 256; i++) {
    key[i] = i;
  }
  
  // Key scheduling algorithm (simplified RC4-like)
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + key[i] + keyBytes[i % keyBytes.length]) % 256;
    [key[i], key[j]] = [key[j], key[i]];
  }
  
  // Encrypt the content
  const encrypted = new Uint8Array(content.length);
  let i = 0, k = 0;
  
  for (let pos = 0; pos < content.length; pos++) {
    i = (i + 1) % 256;
    k = (k + key[i]) % 256;
    [key[i], key[k]] = [key[k], key[i]];
    const keystreamByte = key[(key[i] + key[k]) % 256];
    encrypted[pos] = content[pos] ^ keystreamByte;
  }
  
  console.log('Content encryption completed');
  return encrypted;
};

export const decryptContent = (encryptedContent: Uint8Array, password: string): Uint8Array => {
  console.log('Starting content decryption...');
  // The encryption is symmetric, so we use the same function
  return encryptContent(encryptedContent, password);
};

export const convertToBase64Safely = (content: Uint8Array): string => {
  console.log('Converting encrypted content to base64...');
  
  // Convert directly to base64 without chunking to avoid corruption
  const binaryString = Array.from(content, byte => String.fromCharCode(byte)).join('');
  return btoa(binaryString);
};

export const convertFromBase64Safely = (base64Content: string): Uint8Array => {
  console.log('Converting base64 back to binary...');
  
  const binaryString = atob(base64Content);
  const content = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    content[i] = binaryString.charCodeAt(i);
  }
  
  return content;
};
