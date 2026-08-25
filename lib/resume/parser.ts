/**
 * Extracts raw text from PDF or DOCX buffers.
 * Uses pdf-parse (v2+ PDFParse / v1 fallback) with global DOM polyfills for Next.js, and mammoth for DOCX.
 */

// Polyfill DOM globals required by PDF.js in Next.js Server Components / Node runtime
function ensurePdfEnvironmentPolyfills() {
  const g = globalThis as unknown as Record<string, unknown>;

  if (typeof g.DOMMatrix === "undefined") {
    class DOMMatrixPolyfill {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true;
      isIdentity = true;
      constructor(init?: unknown) {
        if (Array.isArray(init)) {
          if (init.length === 6) {
            this.a = this.m11 = init[0];
            this.b = this.m12 = init[1];
            this.c = this.m21 = init[2];
            this.d = this.m22 = init[3];
            this.e = this.m41 = init[4];
            this.f = this.m42 = init[5];
          } else if (init.length === 16) {
            this.m11 = init[0]; this.m12 = init[1]; this.m13 = init[2]; this.m14 = init[3];
            this.m21 = init[4]; this.m22 = init[5]; this.m23 = init[6]; this.m24 = init[7];
            this.m31 = init[8]; this.m32 = init[9]; this.m33 = init[10]; this.m34 = init[11];
            this.m41 = init[12]; this.m42 = init[13]; this.m43 = init[14]; this.m44 = init[15];
          }
        }
      }
      multiply() { return this; }
      translate() { return this; }
      scale() { return this; }
      rotate() { return this; }
      inverse() { return this; }
      transformPoint(p: unknown) { return p; }
      toFloat32Array() { return new Float32Array(16); }
      toFloat64Array() { return new Float64Array(16); }
    }
    g.DOMMatrix = DOMMatrixPolyfill;
  }

  if (typeof g.Path2D === "undefined") {
    class Path2DPolyfill {
      addPath() {}
      closePath() {}
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      arcTo() {}
      ellipse() {}
      rect() {}
    }
    g.Path2D = Path2DPolyfill;
  }

  if (typeof g.ImageData === "undefined") {
    class ImageDataPolyfill {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
        this.data = new Uint8ClampedArray(w * h * 4);
      }
    }
    g.ImageData = ImageDataPolyfill;
  }
}

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
  ensurePdfEnvironmentPolyfills();

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require("pdf-parse");

    // Support pdf-parse v2+ ({ PDFParse: class })
    if (pdfModule?.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      if (typeof result === "string" && result.trim().length > 0) return result.trim();
      if (result && typeof result.text === "string" && result.text.trim().length > 0) {
        return result.text.trim();
      }
    }

    // Support pdf-parse v1 (function export)
    if (typeof pdfModule === "function") {
      const result = await pdfModule(buffer);
      if (result?.text && result.text.trim().length > 0) return result.text.trim();
    }

    if (typeof pdfModule?.default === "function") {
      const result = await pdfModule.default(buffer);
      if (result?.text && result.text.trim().length > 0) return result.text.trim();
    }
  } catch (err) {
    console.warn("[PDF Parser] PDF.js engine encountered warning, attempting stream fallback:", err);
  }

  // Fallback: Extract ASCII / UTF-8 text streams from raw PDF
  const fallbackText = extractRawTextFromPdfStreams(buffer);
  if (fallbackText && fallbackText.length > 30) {
    return fallbackText;
  }

  throw new Error("Could not extract readable text from PDF file. Please ensure it is not password protected or image-only.");
}

/**
 * Fallback parser that scans uncompressed text chunks in PDF stream objects
 */
function extractRawTextFromPdfStreams(buffer: Buffer): string {
  const content = buffer.toString("latin1");
  const textChunks: string[] = [];

  // Match text in Parentheses after Tj or inside TJ arrays [(...)]
  const tjRegex = /\(([^()]{2,})\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(content)) !== null) {
    textChunks.push(match[1]);
  }

  const arrayRegex = /\[\s*((?:\([^)]*\)\s*[-0-9.\s]*)+)\s*\]\s*TJ/g;
  while ((match = arrayRegex.exec(content)) !== null) {
    const inner = match[1];
    const itemRegex = /\(([^)]+)\)/g;
    let item;
    const parts = [];
    while ((item = itemRegex.exec(inner)) !== null) {
      parts.push(item[1]);
    }
    if (parts.length > 0) {
      textChunks.push(parts.join(" "));
    }
  }

  return textChunks.join(" ").replace(/\\([()\\])/g, "$1").trim();
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

export function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}