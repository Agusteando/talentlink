import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// Helper to save file to disk (Windows Server safe)
export async function saveFileToDisk(file) {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Ensure directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Sanitize filename to prevent Windows path issues
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadDir, safeName);

  await fs.writeFile(filePath, buffer);
  
  // Return the URL path for the database
  return { 
    url: `/uploads/${safeName}`, 
    buffer: buffer 
  };
}

// Real PDF & Word Extraction Logic
export async function extractResumeData(buffer, mimeType) {
  let text = "";
  
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdf(buffer);
      text = data.text;
    } 
    // REAL DOCX PARSING
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: buffer });
      text = result.value;
    } 
    else {
      text = "Formato no soportado para extracción de texto automática.";
    }
  } catch (error) {
    console.error("Error parsing file:", error);
    text = "Error de lectura de archivo.";
  }

  // Real Regex to find contacts
  const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/gi;
  const emails = text.match(emailRegex);
  const detectedEmail = emails ? emails[0] : "";

  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  const detectedPhone = phones ? phones[0] : "";

  return {
    text: text.substring(0, 10000), // Safety limit for MySQL TEXT column
    email: detectedEmail,
    phone: detectedPhone
  };
}