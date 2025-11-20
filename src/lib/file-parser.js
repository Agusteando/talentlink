import pdf from 'pdf-parse';

export async function parseResume(fileBuffer, mimeType) {
  try {
    let text = "";

    // Handle PDFs
    if (mimeType === 'application/pdf') {
      const data = await pdf(fileBuffer);
      text = data.text;
    } 
    // Handle Word Docs (Basic extraction fallback or requires heavier libs like mammoth)
    // For this MVP, if it's not PDF, we leave text empty or add a placeholder.
    else {
      text = "Contenido no extraíble automáticamente (Formato Word/Doc).";
    }

    // Simple RegEx to try and find an email (A basic "AI" feature)
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const phoneRegex = /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/; // Basic pattern

    const detectedEmail = text.match(emailRegex)?.[0] || "";
    const detectedPhone = text.match(phoneRegex)?.[0] || "";

    return {
      text: text.substring(0, 5000), // Limit DB storage
      detectedData: {
        email: detectedEmail,
        phone: detectedPhone
      }
    };
  } catch (error) {
    console.error("Error Parsing PDF:", error);
    return { text: "", detectedData: {} };
  }
}