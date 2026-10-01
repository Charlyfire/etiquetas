import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import type { Project } from '../types';

/**
 * Export single element (DOM node) to PNG data URL
 */
export async function exportElementToPngDataUrl(element: HTMLElement, scale: number = 3): Promise<string> {
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null, // Transparent if label background is transparent
  });
  return canvas.toDataURL('image/png');
}

/**
 * Download PNG image file
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export full A4 print sheet container to PDF file
 */
export async function exportSheetPagesToPdf(
  pageElements: HTMLElement[],
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  if (pageElements.length === 0) return;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < pageElements.length; i++) {
    if (i > 0) {
      pdf.addPage('a4', orientation);
    }

    const elem = pageElements[i];
    const canvas = await html2canvas(elem, {
      scale: 3, // 300 DPI high resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  }

  pdf.save(filename);
}

/**
 * Export batch PNG images of all labels as a ZIP archive
 */
export async function exportLabelsToZip(
  labelElements: { name: string; element: HTMLElement }[],
  zipFilename: string
) {
  const zip = new JSZip();
  const folder = zip.folder('etiquetas');

  for (let i = 0; i < labelElements.length; i++) {
    const item = labelElements[i];
    const dataUrl = await exportElementToPngDataUrl(item.element, 3);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const cleanName = item.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    folder?.file(`etiqueta_${i + 1}_${cleanName}.png`, base64Data, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, zipFilename);
  URL.revokeObjectURL(url);
}

/**
 * Backup project as JSON file (.etiquetas)
 */
export function exportProjectToJsonFile(project: Project) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadDataUrl(url, `${safeName}.etiquetas`);
  URL.revokeObjectURL(url);
}

/**
 * Import project from JSON file (.etiquetas)
 */
export async function importProjectFromJsonFile(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const project = JSON.parse(content) as Project;
        if (!project.id || !project.name || !project.records) {
          throw new Error('El archivo de proyecto no tiene un formato válido.');
        }
        resolve(project);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
