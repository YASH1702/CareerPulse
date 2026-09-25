/**
 * 1-Click Client-side Resume PDF Exporter
 * Captures the exact rendered DOM resume sheet and saves it directly
 * as a high-fidelity, single-page A4 PDF without opening the browser's print dialog.
 */

export interface ExportPdfOptions {
  elementId?: string;
  filename?: string;
  onProgress?: (status: "capturing" | "generating" | "done" | "error") => void;
}

export async function exportResumeToPdf({
  elementId = "replica-resume-sheet",
  filename = "Yashwant_Kariha_Resume.pdf",
  onProgress,
}: ExportPdfOptions = {}): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    if (onProgress) onProgress("capturing");

    // Use html2canvas-pro which natively supports Tailwind CSS v4 modern color functions (lab, oklab, oklch)
    const html2canvas = (await import("html2canvas-pro")).default;
    const { jsPDF } = await import("jspdf");

    // Locate target element with fallback chain
    let target = document.getElementById(elementId);
    if (!target) {
      target = document.querySelector(`[id="${elementId}"]`) as HTMLElement;
    }
    if (!target) {
      target = document.querySelector(".replica-resume-sheet") as HTMLElement;
    }
    if (!target) {
      target = document.getElementById("replica-resume-tailored");
    }
    if (!target) {
      target = document.getElementById("replica-resume-sheet");
    }

    if (!target) {
      console.error(`[CareerPulse PDF Export]: Target resume element not found (tried "${elementId}").`);
      if (onProgress) onProgress("error");
      return false;
    }

    // Extract fallback link coordinates from live DOM before clone
    interface LinkAnnotation {
      url: string;
      relX: number;
      relY: number;
      relW: number;
      relH: number;
    }

    const realTargetRect = target.getBoundingClientRect();
    const fallbackLinks: LinkAnnotation[] = Array.from(target.querySelectorAll("a[href]"))
      .map((el) => {
        const a = el as HTMLAnchorElement;
        const href = a.getAttribute("href") || a.href;
        if (!href || href === "#" || href.startsWith("javascript:")) return null;
        const aRect = a.getBoundingClientRect();
        if (aRect.width === 0 || aRect.height === 0) return null;
        return {
          url: href,
          relX: aRect.left - realTargetRect.left,
          relY: aRect.top - realTargetRect.top,
          relW: aRect.width,
          relH: aRect.height,
        };
      })
      .filter(Boolean) as LinkAnnotation[];

    let detectedLinks: LinkAnnotation[] = [];
    let clonedTargetWidth = 820;
    let clonedTargetHeight = 1160;

    // Capture high-resolution canvas of the rendered resume
    const canvas = await html2canvas(target, {
      scale: 2, // 2x scale (~200 DPI): razor-sharp text, fast capture, and universally reliable memory footprint
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        const clonedEl =
          clonedDoc.getElementById(elementId) ||
          clonedDoc.getElementById("replica-resume-tailored") ||
          clonedDoc.getElementById("replica-resume-sheet") ||
          clonedDoc.querySelector(".replica-resume-sheet");

        if (clonedEl) {
          // Hide all UI badges, preview indicators, and action bars
          clonedEl.querySelectorAll(".print\\:hidden").forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });

          // Reset all preview diff highlighting (green boxes, borders)
          clonedEl.querySelectorAll(".bg-emerald-50\\/70, .bg-emerald-50\\/90, .bg-emerald-100").forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.backgroundColor = "transparent";
            htmlEl.style.border = "none";
            htmlEl.style.boxShadow = "none";
            htmlEl.style.padding = "0";
          });

          // Ensure authentic clean borders and margins for PDF
          const htmlTarget = clonedEl as HTMLElement;
          htmlTarget.style.boxShadow = "none";
          htmlTarget.style.border = "none";
          htmlTarget.style.borderRadius = "0";
          htmlTarget.style.margin = "0";
          htmlTarget.style.width = "820px";
          htmlTarget.style.maxWidth = "820px";
          htmlTarget.style.padding = "24px 32px 20px 32px";

          // Read exact bounding rect of cloned resume sheet
          const targetRect = htmlTarget.getBoundingClientRect();
          clonedTargetWidth = targetRect.width || 820;
          clonedTargetHeight = targetRect.height || 1160;

          // Map every anchor link inside the sheet
          const anchors = Array.from(htmlTarget.querySelectorAll("a[href]"));
          detectedLinks = anchors
            .map((el) => {
              const a = el as HTMLAnchorElement;
              const href = a.getAttribute("href") || a.href;
              if (!href || href === "#" || href.startsWith("javascript:")) return null;

              const aRect = a.getBoundingClientRect();
              if (aRect.width === 0 || aRect.height === 0) return null;

              return {
                url: href,
                relX: aRect.left - targetRect.left,
                relY: aRect.top - targetRect.top,
                relW: aRect.width,
                relH: aRect.height,
              };
            })
            .filter(Boolean) as LinkAnnotation[];
        }
      },
    });

    if (onProgress) onProgress("generating");

    // A4 Portrait dimensions: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfPageWidth = 210;
    const pdfPageHeight = 297;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate proportional height when fitted to A4 width
    let renderWidth = pdfPageWidth;
    let renderHeight = (canvasHeight * pdfPageWidth) / canvasWidth;
    let offsetX = 0;
    let offsetY = 0;

    // Strict 1-page guard: if content exceeds 297mm height, scale down slightly
    if (renderHeight > pdfPageHeight) {
      const scaleFactor = (pdfPageHeight - 2) / renderHeight;
      renderHeight = pdfPageHeight - 2;
      renderWidth = pdfPageWidth * scaleFactor;
      offsetX = (pdfPageWidth - renderWidth) / 2;
      offsetY = 1;
    } else {
      offsetY = 0;
    }

    // High quality JPEG format: 0.98 quality uses native PDF /DCTDecode stream (instant, ~400KB, crisp text)
    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    pdf.addImage(imgData, "JPEG", offsetX, offsetY, renderWidth, renderHeight, undefined, "FAST");

    // Add interactive clickable PDF link annotations (Email, LinkedIn, GitHub, Portfolio, Phone, etc.)
    const linksToApply = detectedLinks.length > 0 ? detectedLinks : fallbackLinks;
    const baseWidth = clonedTargetWidth || target.offsetWidth || 820;
    const baseHeight = clonedTargetHeight || target.offsetHeight || 1160;
    const scaleX = renderWidth / baseWidth;
    const scaleY = renderHeight / baseHeight;

    for (const link of linksToApply) {
      let url = link.url;
      // Ensure url is absolute
      if (
        !url.startsWith("http://") &&
        !url.startsWith("https://") &&
        !url.startsWith("mailto:") &&
        !url.startsWith("tel:")
      ) {
        url = `https://${url}`;
      }

      const pdfX = offsetX + link.relX * scaleX;
      const pdfY = offsetY + link.relY * scaleY;
      const pdfW = link.relW * scaleX;
      const pdfH = link.relH * scaleY;

      pdf.link(pdfX, pdfY, pdfW, pdfH, { url });
    }

    // Download PDF directly
    const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);

    if (onProgress) onProgress("done");
    return true;
  } catch (error) {
    console.error("[CareerPulse PDF Export Error]:", error);
    if (onProgress) onProgress("error");
    return false;
  }
}
