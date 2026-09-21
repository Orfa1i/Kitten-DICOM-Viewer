import React, { useMemo, useState } from 'react';
import {
  FileText,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  parseReport,
  extractObservationLabel,
  checkStudyConsistency,
  AI_REPORT_DISCLAIMER,
} from '../../utils/reportParser';
import './ClinicalFindingsReport.css';

export interface ClinicalFindingsReportProps {
  /** Raw report string or array of findings from backend/MedGemma */
  reportText?: string | string[] | null;
  /** Study title or diagnosis name (e.g. 'Knee Osteoarthritis Analysis') for consistency checking */
  studyTitle?: string;
  /** Optional custom class name for styling flexibility */
  className?: string;
  /** Optional title override (defaults to 'Clinical Findings') */
  title?: string;
  /** Optional callback when doctor edits the report */
  onEdit?: (updatedText: string) => void;
  /** Toggle whether doctor can edit directly */
  editable?: boolean;
}

export const ClinicalFindingsReport: React.FC<ClinicalFindingsReportProps> = ({
  reportText,
  studyTitle,
  className = '',
  title = 'Clinical Findings',
  onEdit,
  editable = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(() => {
    if (Array.isArray(reportText)) return reportText.join('\n\n');
    return reportText || '';
  });

  const parsed = useMemo(() => {
    return parseReport(isEditing ? editValue : reportText);
  }, [reportText, isEditing, editValue]);

  // Non-blocking anatomical consistency check
  const consistency = useMemo(() => {
    return checkStudyConsistency(studyTitle, reportText || editValue);
  }, [studyTitle, reportText, editValue]);

  const handleCopy = async () => {
    const sections: string[] = [];
    if (parsed.impression) {
      sections.push(`CLINICAL IMPRESSION:\n${parsed.impression}`);
    }
    if (parsed.observations.length > 0) {
      sections.push(
        `KEY OBSERVATIONS:\n${parsed.observations.map((o) => `• ${o}`).join('\n')}`
      );
    }
    if (parsed.limitations.length > 0) {
      sections.push(
        `LIMITATIONS:\n${parsed.limitations.map((l) => `• ${l}`).join('\n')}`
      );
    }
    const fullText = sections.join('\n\n') || (typeof reportText === 'string' ? reportText : '');
    if (!fullText) return;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(editValue);
    }
  };

  const hasAnySection =
    Boolean(parsed.impression) ||
    parsed.observations.length > 0 ||
    parsed.limitations.length > 0;

  return (
    <section
      aria-labelledby="clinical-findings-title"
      className={`clinical-findings-card ${className}`}
    >
      {/* 1. Card Header */}
      <header className="clinical-findings-header">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#8D321F]/15 border border-[#8D321F]/30 flex items-center justify-center text-[#D77766]">
            <FileText className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="clinical-findings-title"
              className="text-base md:text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2"
            >
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 no-print">
          {editable && (
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveEdit();
                } else {
                  setEditValue(
                    [
                      parsed.impression ? `Overall Impression: ${parsed.impression}` : '',
                      parsed.observations.length > 0
                        ? `Key Observations:\n${parsed.observations.map((o) => `* ${o}`).join('\n')}`
                        : '',
                      parsed.limitations.length > 0
                        ? `Limitations:\n${parsed.limitations.map((l) => `* ${l}`).join('\n')}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join('\n\n')
                  );
                  setIsEditing(true);
                }
              }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#8D321F]"
              aria-label={isEditing ? 'Save Report Changes' : 'Edit Report'}
            >
              {isEditing ? 'Save Changes' : 'Edit'}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md border border-zinc-750 bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#8D321F]"
            title="Copy Clean Report"
            aria-label="Copy Clean Report"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Non-blocking study & anatomy consistency notice */}
      {consistency.isMismatch && (
        <div
          className="mx-5 md:mx-6 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-amber-300 text-xs font-medium no-print"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>{consistency.message}</span>
        </div>
      )}

      {/* Main Content Body */}
      <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
        {isEditing ? (
          <div className="flex flex-col h-full space-y-3">
            <label htmlFor="edit-report-textarea" className="text-xs text-zinc-400 font-medium">
              Edit Clinical Report Text
            </label>
            <textarea
              id="edit-report-textarea"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={12}
              className="w-full flex-1 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-zinc-100 text-sm leading-relaxed focus:outline-none focus:border-[#8D321F] font-mono resize-y"
            />
          </div>
        ) : (
          <>
            {/* Empty State */}
            {!hasAnySection && (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                <FileText className="w-10 h-10 text-zinc-600 mb-3" aria-hidden="true" />
                <p className="text-sm text-zinc-400">
                  No clinical findings recorded for this radiograph study.
                </p>
              </div>
            )}

            {/* 2. Overall Impression */}
            {parsed.impression && (
              <article className="space-y-2" aria-labelledby="section-overall-impression">
                <h3 id="section-overall-impression" className="clinical-section-heading">
                  Overall Impression
                </h3>
                <p className="clinical-section-body text-zinc-200">
                  {parsed.impression}
                </p>
              </article>
            )}

            {/* 3. Key Observations (Clean bullet list with bold prefix labels) */}
            {parsed.observations.length > 0 && (
              <article className="space-y-2.5" aria-labelledby="section-key-observations">
                <h3 id="section-key-observations" className="clinical-section-heading">
                  Key Observations
                </h3>
                <ul className="clinical-observations-list" role="list">
                  {parsed.observations.map((obsStr, idx) => {
                    const detail = extractObservationLabel(obsStr);
                    return (
                      <li key={`obs-${idx}`} className="clinical-observation-item">
                        <span className="clinical-bullet-dot" aria-hidden="true" />
                        <div className="flex-1">
                          {detail.label && (
                            <strong className="font-semibold text-zinc-100 mr-1.5 inline-block">
                              {detail.label}
                            </strong>
                          )}
                          <span className="text-zinc-300">{detail.text}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </article>
            )}

            {/* 4. Limitations (Visually Secondary, Muted Box) */}
            {parsed.limitations.length > 0 && (
              <article
                className="clinical-limitations-box space-y-2 mt-4"
                aria-labelledby="section-limitations"
              >
                <h3
                  id="section-limitations"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                  Limitations
                </h3>
                <ul className="space-y-1.5 list-none m-0 p-0" role="list">
                  {parsed.limitations.map((limStr, idx) => (
                    <li key={`lim-${idx}`} className="clinical-limitations-item">
                      <span className="text-zinc-500 font-bold select-none">•</span>
                      <span className="flex-1">{limStr}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </>
        )}
      </div>

      {/* 5. Footer Disclaimer */}
      <footer className="clinical-findings-footer" role="contentinfo">
        <ShieldCheck className="w-4 h-4 text-amber-500/90 shrink-0" aria-hidden="true" />
        <p className="text-xs text-zinc-400 leading-snug">
          {AI_REPORT_DISCLAIMER}
        </p>
      </footer>
    </section>
  );
};
