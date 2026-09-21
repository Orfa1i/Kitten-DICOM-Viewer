import { jsPDF } from 'jspdf';
import type { DiagnosticReportData, PatientData } from '../types/index.ts';
import { parseReport, AI_REPORT_DISCLAIMER } from '../utils/reportParser.ts';

export interface PdfReportPayload {
  patient: PatientData;
  report: DiagnosticReportData;
  modelType: string;
  accuracyScore: number;
  annotatedImageUrl?: string | null;
  uploadedImageUrl?: string | null;
  pubmedCitations?: Array<{
    pmid: string;
    title: string;
    authors: string;
    journal: string;
    takeaway?: string;
  }>;
}

export const generateAndDownloadPdfReport = async (data: PdfReportPayload) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 25;

  // Colors
  const rustColor = [141, 50, 31]; // #8D321F Kitten Burgundy
  const darkText = [45, 45, 48];
  const mutedText = [100, 100, 105];
  const lightMutedText = [125, 125, 130];

  // Helper: check space and avoid orphaned section headers
  const checkPageBreak = (neededMm: number) => {
    if (currentY + neededMm > pageHeight - margin) {
      doc.addPage();
      currentY = margin + 5;
      return true;
    }
    return false;
  };

  // 1. HEADER (Kitten & Client Info)
  doc.setTextColor(rustColor[0], rustColor[1], rustColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.text('Kitten', margin, currentY);

  // Client Info (Right Side)
  const rightColumnX = pageWidth - margin - 50;
  doc.setFontSize(10);
  doc.text('\u2022 Client Information:', rightColumnX, currentY - 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('Hospital Name: Kitten Central', rightColumnX + 3, currentY - 4);
  doc.text('Location: Radiology Dept', rightColumnX + 3, currentY + 2);
  doc.text('Reported By: Dr. Hassan, MD', rightColumnX + 3, currentY + 8);

  currentY += 5;

  // 2. THIN BAR
  const barWidth = contentWidth - 55;
  doc.setFillColor(rustColor[0], rustColor[1], rustColor[2]);
  doc.rect(margin, currentY, barWidth, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(
    'Precision Radiograph AI. Sub-Second Diagnostic Intelligence.',
    margin + 2,
    currentY + 3.5
  );

  currentY += 6;

  // 3. THICK BAR
  doc.setFillColor(rustColor[0], rustColor[1], rustColor[2]);
  doc.rect(margin, currentY, barWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Diagnostic Report', margin + 2, currentY + 8);

  currentY += 20;

  // 4. TABLE
  const rowHeight = 11;
  const col1Width = 40;
  const col2Width = contentWidth - col1Width;
  const tableData = [
    {
      label: 'Report title',
      value:
        data.modelType === 'fracture-detection'
          ? 'Fracture Detection Analysis'
          : 'Knee Osteoarthritis Analysis',
    },
    { label: 'Name', value: data.patient.name || 'Unknown Patient' },
    { label: 'Date', value: new Date().toLocaleDateString() },
    {
      label: 'Ticket ID',
      value: data.patient.id || `CASE-${Math.floor(Math.random() * 10000)}`,
    },
  ];

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);

  tableData.forEach((row) => {
    // Col 1
    doc.setFillColor(rustColor[0], rustColor[1], rustColor[2]);
    doc.rect(margin, currentY, col1Width, rowHeight, 'FD');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(row.label, margin + col1Width / 2, currentY + 7.5, { align: 'center' });

    // Col 2
    doc.setFillColor(255, 255, 255);
    doc.rect(margin + col1Width, currentY, col2Width, rowHeight, 'FD');
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(row.value, margin + col1Width + 5, currentY + 7.5);

    currentY += rowHeight;
  });

  currentY += 12;

  // Helper for Section Headers (Keep-with-next to avoid orphan headers)
  const drawSectionHeader = (title: string) => {
    checkPageBreak(35); // Ensure at least header + first content lines fit
    doc.setFillColor(rustColor[0], rustColor[1], rustColor[2]);
    doc.rect(margin, currentY, 75, 9, 'F');

    // Thin line extending from the block
    doc.setDrawColor(rustColor[0], rustColor[1], rustColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin + 75, currentY + 4.5, margin + contentWidth, currentY + 4.5);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(title, margin + 4, currentY + 6.5);

    currentY += 14;
  };

  // Shared Parsed Report Output
  const parsed = parseReport(data.report.findings);

  // 5. EXECUTIVE SUMMARY
  drawSectionHeader('Executive Summary:');

  const execSummaryStartY = currentY - 2;

  // Render "Key Findings" using parsed clinical sections
  doc.setTextColor(rustColor[0], rustColor[1], rustColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('\u2022 Key Findings:', margin + 5, currentY);
  currentY += 5.5;

  const bodyLineSpacing = 4.6; // ~10.5pt font with 1.4 line-height
  const textIndentX = margin + 8;
  const textWidth = contentWidth - 14;

  // A. Overall Impression
  if (parsed.impression) {
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(rustColor[0], rustColor[1], rustColor[2]);
    doc.text('Overall Impression:', textIndentX, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    const impressionLines = doc.splitTextToSize(parsed.impression, textWidth);
    doc.text(impressionLines, textIndentX, currentY);
    currentY += impressionLines.length * bodyLineSpacing + 4; // 6-10pt sub-section spacing
  }

  // B. Key Observations (proper bulleted list with hanging indent)
  if (parsed.observations.length > 0) {
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(rustColor[0], rustColor[1], rustColor[2]);
    doc.text('Key Observations:', textIndentX, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);

    parsed.observations.forEach((obs) => {
      checkPageBreak(8);
      // Bullet dot
      doc.setTextColor(rustColor[0], rustColor[1], rustColor[2]);
      doc.text('\u2022', textIndentX + 1, currentY);

      // Bullet text with hanging indent
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      const obsLines = doc.splitTextToSize(obs, textWidth - 5);
      doc.text(obsLines, textIndentX + 5, currentY);
      currentY += obsLines.length * bodyLineSpacing + 2;
    });

    currentY += 3;
  }

  // C. Limitations (bulleted list in slightly muted text)
  if (parsed.limitations.length > 0) {
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('Limitations:', textIndentX, currentY);
    currentY += 4.2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);

    parsed.limitations.forEach((lim) => {
      checkPageBreak(7);
      doc.text('-', textIndentX + 1, currentY);
      const limLines = doc.splitTextToSize(lim, textWidth - 5);
      doc.text(limLines, textIndentX + 5, currentY);
      currentY += limLines.length * (bodyLineSpacing - 0.4) + 1.8;
    });

    currentY += 3;
  }

  // D. Small Italic Disclaimer
  checkPageBreak(10);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(lightMutedText[0], lightMutedText[1], lightMutedText[2]);
  const disclaimerLines = doc.splitTextToSize(AI_REPORT_DISCLAIMER, textWidth);
  doc.text(disclaimerLines, textIndentX, currentY);
  currentY += disclaimerLines.length * 3.8 + 6;

  // Purpose (follows naturally with no excessive blank gap)
  checkPageBreak(14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(rustColor[0], rustColor[1], rustColor[2]);
  doc.text('\u2022 Purpose:', margin + 5, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  const purposeText = `Clinical radiograph evaluation of ${data.patient.name || 'patient'} for ${
    data.report.diagnosis || 'diagnostic anomalies'
  }.`;
  const purposeLines = doc.splitTextToSize(purposeText, textWidth);
  doc.text(purposeLines, textIndentX, currentY);
  currentY += purposeLines.length * bodyLineSpacing + 4;

  // Draw vertical indicator line for Executive Summary if on same page
  doc.setDrawColor(rustColor[0], rustColor[1], rustColor[2]);
  doc.setLineWidth(0.3);
  doc.line(margin + 1, execSummaryStartY, margin + 1, currentY - 2);

  currentY += 8;

  // 6. ISSUE DESCRIPTION
  drawSectionHeader('Issue Description:');

  const issueDescStartY = currentY - 2;

  checkPageBreak(14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(rustColor[0], rustColor[1], rustColor[2]);
  doc.text('\u2022 Problem Statement:', margin + 5, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  const problemText =
    data.report.diagnosis || 'Undiagnosed clinical condition requiring imaging analysis.';
  const problemLines = doc.splitTextToSize(problemText, textWidth);
  doc.text(problemLines, textIndentX, currentY);
  currentY += problemLines.length * bodyLineSpacing + 4;

  checkPageBreak(14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(rustColor[0], rustColor[1], rustColor[2]);
  doc.text('\u2022 Symptoms and Impact:', margin + 5, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  const recommendationText =
    data.report.recommendation || 'Further clinical correlation required.';
  const recommendationLines = doc.splitTextToSize(recommendationText, textWidth);
  doc.text(recommendationLines, textIndentX, currentY);
  currentY += recommendationLines.length * bodyLineSpacing + 4;

  // Draw vertical indicator line for Issue Description
  doc.setDrawColor(rustColor[0], rustColor[1], rustColor[2]);
  doc.setLineWidth(0.3);
  doc.line(margin + 1, issueDescStartY, margin + 1, currentY - 2);

  // Save the PDF file
  const fileName = `Kitten_Diagnostic_Report_${data.patient.id || 'Case'}_${Date.now()}.pdf`;
  doc.save(fileName);
};
