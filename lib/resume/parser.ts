/**
 * Extracts raw text from PDF or DOCX buffers.
 * Uses pdf-parse (v2+ PDFParse / v1 fallback) for PDFs, mammoth for DOCX.
 */

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<string> {
  const isPdf =
    mimeType === "application/pdf" ||
    (fileName && fileName.toLowerCase().endsWith(".pdf")) ||
    buffer.slice(0, 5).toString("ascii").startsWith("%PDF");

  const isDocx =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    (fileName &&
      (fileName.toLowerCase().endsWith(".docx") ||
        fileName.toLowerCase().endsWith(".doc")));

  if (isPdf) {
    return extractFromPdf(buffer);
  }
  if (isDocx) {
    return extractFromDocx(buffer);
  }
  throw new Error(`Unsupported file type: ${mimeType || fileName || "Unknown"}`);
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfModule = require("pdf-parse");

  // Support pdf-parse v2+ ({ PDFParse: class })
  if (pdfModule?.PDFParse) {
    const parser = new pdfModule.PDFParse({ data: buffer });
    const result = await parser.getText();
    if (typeof result === "string") return result.trim();
    if (result && typeof result.text === "string") return result.text.trim();
  }

  // Support pdf-parse v1 (function export)
  if (typeof pdfModule === "function") {
    const result = await pdfModule(buffer);
    return (result?.text || "").trim();
  }

  if (typeof pdfModule?.default === "function") {
    const result = await pdfModule.default(buffer);
    return (result?.text || "").trim();
  }

  throw new Error("Unable to initialize PDF parsing engine.");
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

export function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}