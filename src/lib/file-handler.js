import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse';

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

// Real PDF Extraction Logic
export async function extractResumeData(buffer, mimeType) {
  let text = "";
  
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdf(buffer);
      text = data.text;
    } else {
      // For Word docs, we'd need 'mammoth', for now we mark it
      text = "Formato Word: Extracción de texto pendiente de implementación (Requiere librería Mammoth).";
    }
  } catch (error) {
    console.error("Error parsing PDF:", error);
    text = "Error al leer el archivo.";
  }

  // Real Regex to find contacts in the text
  // 1. Find emails
  const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/gi;
  const emails = text.match(emailRegex);
  const detectedEmail = emails ? emails[0] : "";

  // 2. Find phone numbers (generic formats)
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  const detectedPhone = phones ? phones[0] : "";

  return {
    text: text.substring(0, 10000), // MySQL TEXT limit safety
    email: detectedEmail,
    phone: detectedPhone
  };
}