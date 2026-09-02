import jsPDF from 'jspdf';
import type { ExportModel } from './packingExport';
import { buildPrintableHtml, buildStandaloneHtmlDocument, docStyleTag } from './packingPrintHtml';

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const MARGIN = 28;

export function openPrintWindow(model: ExportModel) {
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) return;
  win.document.open();
  win.document.write(buildStandaloneHtmlDocument(model));
  win.document.close();
  const triggerPrint = () => {
    win.focus();
    win.print();
  };
  if (win.document.readyState === 'complete') setTimeout(triggerPrint, 250);
  else win.addEventListener('load', () => setTimeout(triggerPrint, 250));
}

export async function buildPdfBlob(model: ExportModel): Promise<Blob> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-10000px';
  container.style.width = '794px';
  container.style.background = '#ffffff';
  container.innerHTML = `${docStyleTag()}${buildPrintableHtml(model)}`;
  document.body.appendChild(container);

  try {
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    await new Promise<void>((resolve, reject) => {
      doc.html(container, {
        x: MARGIN,
        y: MARGIN + 14,
        width: A4_WIDTH_PT - MARGIN * 2,
        windowWidth: 794,
        autoPaging: 'text',
        callback: () => resolve(),
        html2canvas: { scale: 0.85, useCORS: true, backgroundColor: '#ffffff' },
      });
      setTimeout(() => reject(new Error('PDF generation timed out')), 20000);
    });

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(150, 140, 170);
      doc.text(model.trip.name, MARGIN, 16);
      doc.text(`Generated ${model.generatedAt.toLocaleDateString()}`, MARGIN, A4_HEIGHT_PT - 14);
      doc.text(`Page ${p} of ${totalPages}`, A4_WIDTH_PT - MARGIN, A4_HEIGHT_PT - 14, { align: 'right' });
    }

    return doc.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}
