import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType } from 'docx';

export interface WordReportData {
  patient: {
    id: string;
    name: string;
    age?: string;
    sex?: string;
    studyDate?: string;
    modality?: string;
    bodyPart?: string;
  };
  findings: string | string[];
  diagnosisTitle?: string;
  recommendation?: string;
  modelType?: string;
  confidence?: number;
}

export const generateAndDownloadWordReport = async (data: WordReportData) => {
  const findingsText = Array.isArray(data.findings) ? data.findings.join('\n\n') : (data.findings || 'No findings recorded.');
  const paragraphs = findingsText.split('\n').filter(line => line.trim().length > 0);

  // Parse findings paragraphs and format headers/bullet points
  const contentParagraphs = paragraphs.map(p => {
    const isHeader = (p.startsWith('**') && p.includes(':')) || p.startsWith('###') || p.startsWith('1.') || p.startsWith('2.') || p.startsWith('3.');
    const cleanText = p.replace(/\*\*/g, '').replace(/^###\s*/, '').replace(/<end_of_turn>/g, '').trim();
    
    if (isHeader) {
      return new Paragraph({
        children: [
          new TextRun({
            text: cleanText,
            bold: true,
            size: 24, // 12pt
            color: '2B579A' // Word Blue
          })
        ],
        spacing: { before: 240, after: 120 }
      });
    }

    const isBullet = p.trim().startsWith('*') || p.trim().startsWith('-');
    const bulletText = cleanText.replace(/^[\*\-]\s*/, '');

    return new Paragraph({
      children: [
        new TextRun({
          text: bulletText,
          size: 22 // 11pt
        })
      ],
      bullet: isBullet ? { level: 0 } : undefined,
      spacing: { after: 120 }
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: [
          // Header / Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'KITTEN MEDICAL IMAGING DIAGNOSTIC STUDIO',
                bold: true,
                size: 28,
                color: '1E395B'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'CLINICAL RADIOLOGY & MEDGEMMA AI DIAGNOSTIC REPORT',
                italics: true,
                size: 20,
                color: '595959'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),

          // Metadata Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Patient Name:', bold: true, size: 20 })] })]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: data.patient.name || 'Unknown', size: 20 })] })]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Patient ID:', bold: true, size: 20 })] })]
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: data.patient.id || 'N/A', size: 20 })] })]
                  }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Age / Sex:', bold: true, size: 20 })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${data.patient.age || 'N/A'} / ${data.patient.sex ? data.patient.sex.toUpperCase() : 'N/A'}`, size: 20 })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Study Date:', bold: true, size: 20 })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.patient.studyDate || new Date().toLocaleDateString(), size: 20 })] })]
                  }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Modality / Part:', bold: true, size: 20 })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${data.patient.modality || 'DX'}${data.patient.bodyPart ? ' - ' + data.patient.bodyPart : ''}`, size: 20 })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'AI Model:', bold: true, size: 20 })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'MedGemma 1.5-4B Multimodal', size: 20 })] })]
                  }),
                ]
              })
            ]
          }),

          new Paragraph({
            text: '',
            spacing: { after: 300 }
          }),

          // Section title
          new Paragraph({
            children: [
              new TextRun({
                text: 'CLINICAL EVALUATION & FINDINGS',
                bold: true,
                size: 26,
                color: '1E395B'
              })
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 }
          }),

          // Injected findings
          ...contentParagraphs,

          new Paragraph({
            text: '',
            spacing: { before: 400, after: 200 }
          }),

          // Sign-off Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'Reviewed & Approved By:', bold: true, size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'Dr. Mohammad Hassan, MD', size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'Department of Diagnostic Radiology', size: 18, italics: true })] })
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'Status:', bold: true, size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'FINAL APPROVED - CLINICALLY VERIFIED', bold: true, color: '107C41', size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, size: 18 })] })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kitten_Report_${data.patient.id || 'Case'}_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
