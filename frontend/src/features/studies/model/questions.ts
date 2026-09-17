import type { BaseResponse, PostAnswer, PostQuestion, ResponseQuestions, ScreeningQuestion } from './types';

/** Answers to the screening and post-study questions of any study, with their distribution and majority. */
interface QuestionResponse extends BaseResponse { snapshot: ResponseQuestions }

// ── Questions ─────────────────────────────────────────────────────────────

export type QuestionSection = 'screening' | 'post';

export interface QuestionReport {
  id: string;
  section: QuestionSection;
  type: PostQuestion['type'] | 'radio';
  prompt: string;
  answered: number;
  /** Option / value distribution (not for text). */
  distribution: { key: string; label: string; count: number; share: number }[];
  /** Most chosen option(s); empty for text. */
  majority: { label: string; share: number }[];
  average: number | null;
  scaleMax: number | null;
  answers: { participant: number; value: string }[];
}

export function analyzeQuestions(responses: QuestionResponse[]): QuestionReport[] {
  const reports = new Map<string, QuestionReport>();

  const ensure = (section: QuestionSection, q: ScreeningQuestion | PostQuestion) => {
    const key = `${section}:${q.id}`;
    const existing = reports.get(key);
    // Latest version wins for the prompt; options accumulate so removed ones still show.
    const report: QuestionReport = existing ?? {
      id: q.id,
      section,
      type: 'type' in q ? q.type : 'radio',
      prompt: q.prompt,
      answered: 0,
      distribution: [],
      majority: [],
      average: null,
      scaleMax: 'scaleMax' in q ? q.scaleMax : null,
      answers: [],
    };
    report.prompt = q.prompt;
    q.options.forEach((o) => {
      if (!report.distribution.some((d) => d.key === o.id)) report.distribution.push({ key: o.id, label: o.label, count: 0, share: 0 });
    });
    if ('scaleMax' in q && q.scaleMax) {
      report.scaleMax = Math.max(report.scaleMax ?? 0, q.scaleMax);
      for (let v = 1; v <= q.scaleMax; v++) {
        if (!report.distribution.some((d) => d.key === String(v))) report.distribution.push({ key: String(v), label: String(v), count: 0, share: 0 });
      }
    }
    reports.set(key, report);
    return report;
  };

  for (const r of responses) {
    r.snapshot.screeningQuestions.forEach((q) => {
      const report = ensure('screening', q);
      const value = r.screeningAnswers[q.id];
      if (value === undefined) return;
      record(report, r.number, value, q.options);
    });
    r.snapshot.postQuestions.forEach((q) => {
      const report = ensure('post', q);
      const value = r.postAnswers[q.id];
      if (value === undefined) return;
      record(report, r.number, value, q.options);
    });
  }

  for (const report of reports.values()) {
    report.distribution.sort((a, b) => (report.scaleMax ? Number(a.key) - Number(b.key) : 0));
    report.distribution.forEach((d) => (d.share = report.answered ? d.count / report.answered : 0));
    if (report.type !== 'text' && report.answered > 0) {
      const top = Math.max(...report.distribution.map((d) => d.count));
      report.majority = top > 0 ? report.distribution.filter((d) => d.count === top).map((d) => ({ label: d.label, share: d.share })) : [];
    }
    if (report.type === 'stars' || report.type === 'scale') {
      const values = report.answers.map((a) => Number(a.value)).filter((v) => !Number.isNaN(v));
      report.average = values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
    }
  }

  return [...reports.values()];
}

function record(report: QuestionReport, participant: number, value: PostAnswer, options: { id: string; label: string }[]) {
  report.answered++;
  const values = Array.isArray(value) ? value : [String(value)];
  values.forEach((v) => {
    const bucket = report.distribution.find((d) => d.key === v);
    if (bucket) bucket.count++;
  });
  const label = (v: string) => options.find((o) => o.id === v)?.label ?? v;
  report.answers.push({ participant, value: report.type === 'text' ? String(value) : values.map(label).join(', ') });
}
