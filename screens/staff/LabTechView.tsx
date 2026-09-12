import React, { useMemo, useRef, useState } from "react";
import {
  MASTER_TESTS_CATALOG,
  type MasterTestItem,
  type TestSubParameter,
  type DescriptiveExamTemplate,
  type DescriptiveExamField,
} from "../../data/final_catalog";

/**
 * NanoLabs — Laboratory Technician Result Entry
 *
 * Designed around the master laboratory catalog:
 * - Quantitative tests -> structured numeric inputs + units + reference ranges
 * - Qualitative tests -> controlled/select inputs
 * - Descriptive examinations -> sectioned observation forms
 * - Mixed tests -> structured fields + descriptive sections
 * - Culture examinations -> descriptive sections + optional antibiogram
 * - Manual result mode -> rich text result editor
 *
 * IMPORTANT:
 * Reference ranges/methods/critical limits must be reviewed and configured
 * by the laboratory before production use. The frontend never treats its
 * defaults as universally valid medical reference intervals.
 */

type ResultEntryMode = "structured" | "manual" | "both";
type ResultStatus = "draft" | "in_review" | "validated";

type ResultValue = string | number | boolean | null;

interface StructuredResultValue {
  parameterId: string;
  value: ResultValue;
  displayValue?: string;
  unit?: string;
  flag?: "normal" | "low" | "high" | "critical_low" | "critical_high" | "abnormal";
  note?: string;
}

interface ManualResultDocument {
  html: string;
  plainText: string;
  updatedAt: string;
}

interface SavedLabResult {
  id: string;
  patientId: string;
  examinationId: string;
  examinationCode: string;
  examinationName: string;
  technicianId: string;
  technicianName: string;
  entryMode: "structured" | "manual";
  status: ResultStatus;
  structuredResults: StructuredResultValue[];
  manualResult?: ManualResultDocument;
  interpretation?: string;
  technicianNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NanoLabsResultEntrySettings {
  /**
   * Admin controls whether the lab uses:
   * structured = NanoLabs structured form only
   * manual     = manual rich-text result only
   * both       = technician can choose either
   */
  resultEntryMode: ResultEntryMode;

  showReferenceRanges: boolean;
  autoFlagResults: boolean;
  requireTechnicianReviewBeforeValidation: boolean;
  allowManualResultForStructuredTests: boolean;
  allowManualResultForDescriptiveTests: boolean;
  showPatientPreviewBeforeValidation: boolean;
}

interface LabTechViewProps {
  patient: {
    id: string;
    name: string;
    patientNumber?: string;
    dateOfBirth?: string;
    sex?: "male" | "female" | "other" | "unknown";
  };

  examination: MasterTestItem;

  technician: {
    id: string;
    name: string;
  };

  settings?: Partial<NanoLabsResultEntrySettings>;

  existingResult?: Partial<SavedLabResult>;

  onSaveDraft?: (result: SavedLabResult) => Promise<void> | void;
  onSubmitForReview?: (result: SavedLabResult) => Promise<void> | void;
  onValidate?: (result: SavedLabResult) => Promise<void> | void;
  onCancel?: () => void;
}

const DEFAULT_SETTINGS: NanoLabsResultEntrySettings = {
  resultEntryMode: "both",
  showReferenceRanges: true,
  autoFlagResults: true,
  requireTechnicianReviewBeforeValidation: true,
  allowManualResultForStructuredTests: true,
  allowManualResultForDescriptiveTests: true,
  showPatientPreviewBeforeValidation: true,
};

const qualitativeOptions = [
  "Negative",
  "Positive",
  "Non-reactive",
  "Reactive",
  "Detected",
  "Not detected",
  "Absent",
  "Present",
  "Normal",
  "Abnormal",
  "Invalid",
  "Inconclusive",
];

function nowISO() {
  return new Date().toISOString();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHtml(html: string) {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent || "";
}

function getReferenceRange(
  parameter: TestSubParameter,
  sex: LabTechViewProps["patient"]["sex"]
) {
  if (sex === "male") return parameter.refRangeMale;
  if (sex === "female") return parameter.refRangeFemale;
  return parameter.refRangeChild;
}

function getNumericBounds(
  parameter: TestSubParameter,
  sex: LabTechViewProps["patient"]["sex"]
) {
  if (sex === "male") {
    return { min: parameter.maleMin, max: parameter.maleMax };
  }

  if (sex === "female") {
    return { min: parameter.femaleMin, max: parameter.femaleMax };
  }

  return { min: parameter.childMin, max: parameter.childMax };
}

function calculateFlag(
  parameter: TestSubParameter,
  value: ResultValue,
  sex: LabTechViewProps["patient"]["sex"]
): StructuredResultValue["flag"] {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;

  const { min, max } = getNumericBounds(parameter, sex);

  if (min !== undefined && value < min) return "low";
  if (max !== undefined && value > max) return "high";
  if (min !== undefined || max !== undefined) return "normal";

  return undefined;
}

function getInitialValue(parameter: TestSubParameter): ResultValue {
  if (parameter.value !== undefined) return parameter.value;
  if (parameter.patientValue !== undefined) return parameter.patientValue;
  if (parameter.defaultValue !== undefined) return parameter.defaultValue;
  return null;
}

function formatFlag(flag?: StructuredResultValue["flag"]) {
  if (!flag) return null;

  const labels: Record<string, string> = {
    normal: "Normal",
    low: "Low",
    high: "High",
    critical_low: "Critical Low",
    critical_high: "Critical High",
    abnormal: "Abnormal",
  };

  return labels[flag] ?? flag;
}

function isNumericParameter(parameter: TestSubParameter) {
  return parameter.parameterType === "numeric" ||
    parameter.parameterType === "formula" ||
    Boolean(parameter.maleMin !== undefined || parameter.maleMax !== undefined);
}

function isHeading(parameter: TestSubParameter) {
  return parameter.parameterType === "heading";
}

function groupParameters(parameters: TestSubParameter[]) {
  const groups: Array<{
    section: string;
    subsection?: string;
    parameters: TestSubParameter[];
  }> = [];

  for (const parameter of parameters) {
    const section = parameter.sectionHeader || "RESULTS";
    const subsection = parameter.subHeader;

    let group = groups.find(
      (item) => item.section === section && item.subsection === subsection
    );

    if (!group) {
      group = { section, subsection, parameters: [] };
      groups.push(group);
    }

    group.parameters.push(parameter);
  }

  return groups;
}

function Icon({
  children,
  className = "h-4 w-4",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm text-slate-700 hover:bg-slate-100 active:bg-slate-200"
    >
      {children}
    </button>
  );
}

function ManualRichTextEditor({
  value,
  onChange,
}: {
  value: ManualResultDocument;
  onChange: (next: ManualResultDocument) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const exec = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    const html = editorRef.current?.innerHTML || "";
    onChange({
      html,
      plainText: stripHtml(html),
      updatedAt: nowISO(),
    });
  };

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || "";
    onChange({
      html,
      plainText: stripHtml(html),
      updatedAt: nowISO(),
    });
  };

  const insertTable = () => {
    const html = `
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tbody>
          <tr>
            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left">Parameter</th>
            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left">Result</th>
            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left">Reference</th>
          </tr>
          <tr>
            <td style="border:1px solid #cbd5e1;padding:8px"> </td>
            <td style="border:1px solid #cbd5e1;padding:8px"> </td>
            <td style="border:1px solid #cbd5e1;padding:8px"> </td>
          </tr>
        </tbody>
      </table>
    `;

    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    handleInput();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
        <ToolbarButton label="Bold" onClick={() => exec("bold")}>
          <b>B</b>
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")}>
          <i>I</i>
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec("underline")}>
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" onClick={() => exec("strikeThrough")}>
          <s>S</s>
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-slate-300" />

        <ToolbarButton label="Heading" onClick={() => exec("formatBlock", "h3")}>
          H
        </ToolbarButton>
        <ToolbarButton label="Paragraph" onClick={() => exec("formatBlock", "p")}>
          ¶
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-slate-300" />

        <ToolbarButton label="Bullet list" onClick={() => exec("insertUnorderedList")}>
          •
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec("insertOrderedList")}>
          1.
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-slate-300" />

        <ToolbarButton label="Align left" onClick={() => exec("justifyLeft")}>
          ≡
        </ToolbarButton>
        <ToolbarButton label="Center" onClick={() => exec("justifyCenter")}>
          ≡
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => exec("justifyRight")}>
          ≡
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-slate-300" />

        <ToolbarButton label="Insert horizontal line" onClick={() => exec("insertHorizontalRule")}>
          —
        </ToolbarButton>
        <ToolbarButton label="Insert table" onClick={insertTable}>
          ▦
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-slate-300" />

        <ToolbarButton label="Undo" onClick={() => exec("undo")}>
          ↶
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => exec("redo")}>
          ↷
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[420px] p-6 text-[15px] leading-7 text-slate-800 outline-none"
        dangerouslySetInnerHTML={{
          __html:
            value.html ||
            `<p><br></p>`,
        }}
      />

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        <span>Manual result becomes the patient's report result.</span>
        <span>Rich text • tables • lists • formatting</span>
      </div>
    </div>
  );
}

function DescriptiveSection({
  template,
  values,
  onChange,
}: {
  template: DescriptiveExamTemplate;
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  const sections = useMemo(() => {
    const result: Array<{
      title: string;
      fields: DescriptiveExamField[];
    }> = [];

    for (const field of template.fields) {
      const title = field.sectionHeader || "EXAMINATION";
      let section = result.find((item) => item.title === title);

      if (!section) {
        section = { title, fields: [] };
        result.push(section);
      }

      section.fields.push(field);
    }

    return result;
  }, [template]);

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section
          key={section.title}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              {section.title}
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {section.fields.map((field) => (
              <div key={field.id} className="grid gap-3 p-5 md:grid-cols-[minmax(220px,0.8fr)_1.5fr]">
                <div>
                  <div className="font-medium text-slate-800">{field.label}</div>
                  {field.subHeader && (
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      {field.subHeader}
                    </div>
                  )}
                  {field.suggestedNormalWording && (
                    <div className="mt-2 text-xs text-slate-400">
                      Normal/reference wording: {field.suggestedNormalWording}
                    </div>
                  )}
                </div>

                <textarea
                  value={values[field.id] ?? ""}
                  onChange={(event) => onChange(field.id, event.target.value)}
                  placeholder="Enter observation..."
                  rows={2}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function StructuredResultForm({
  examination,
  patientSex,
  values,
  onChange,
  showReferenceRanges,
}: {
  examination: MasterTestItem;
  patientSex: LabTechViewProps["patient"]["sex"];
  values: Record<string, StructuredResultValue>;
  onChange: (parameter: TestSubParameter, value: ResultValue) => void;
  showReferenceRanges: boolean;
}) {
  const parameters = examination.subParameters || [];
  const groups = groupParameters(parameters);

  if (!parameters.length && examination.descriptiveTemplate) {
    return null;
  }

  if (!parameters.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
          <Icon className="h-6 w-6">
            <path d="M12 3v18M3 12h18" />
          </Icon>
        </div>
        <p className="font-semibold text-slate-800">No structured parameters configured</p>
        <p className="mt-1 text-sm text-slate-500">
          Use the manual result option for this examination or configure its parameters in the catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section
          key={`${group.section}-${group.subsection || ""}`}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              {group.section}
            </h3>
            {group.subsection && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                {group.subsection}
              </p>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {group.parameters.map((parameter) => {
              if (isHeading(parameter)) {
                return (
                  <div key={parameter.id} className="bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700">
                    {parameter.name}
                  </div>
                );
              }

              const result = values[parameter.id];
              const current = result?.value ?? null;
              const numeric = isNumericParameter(parameter);
              const reference = getReferenceRange(parameter, patientSex);

              return (
                <div
                  key={parameter.id}
                  className="grid gap-4 p-5 lg:grid-cols-[minmax(260px,1fr)_minmax(240px,1fr)_180px]"
                >
                  <div>
                    <label className="font-medium text-slate-800">
                      {parameter.name}
                    </label>

                    {parameter.method && (
                      <div className="mt-1 text-xs text-slate-500">
                        Method: {parameter.method}
                      </div>
                    )}

                    {parameter.notes && (
                      <div className="mt-1 text-xs text-slate-400">
                        {parameter.notes}
                      </div>
                    )}

                    {showReferenceRanges && (
                      <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
                        Reference: {reference || "Configured by laboratory"}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {numeric ? (
                      <input
                        type="number"
                        step="any"
                        value={current === null || current === undefined ? "" : String(current)}
                        onChange={(event) => {
                          const raw = event.target.value;
                          onChange(parameter, raw === "" ? null : Number(raw));
                        }}
                        placeholder="Enter result"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      />
                    ) : parameter.options?.length ? (
                      <select
                        value={current === null || current === undefined ? "" : String(current)}
                        onChange={(event) => onChange(parameter, event.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      >
                        <option value="">Select result...</option>
                        {parameter.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : parameter.parameterType === "select" || parameter.parameterType === "text" ? (
                      <input
                        type="text"
                        value={current === null || current === undefined ? "" : String(current)}
                        onChange={(event) => onChange(parameter, event.target.value)}
                        placeholder="Enter result"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      />
                    ) : (
                      <select
                        value={current === null || current === undefined ? "" : String(current)}
                        onChange={(event) => onChange(parameter, event.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      >
                        <option value="">Select result...</option>
                        {qualitativeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {parameter.unit && (
                      <div className="flex min-w-20 items-center justify-center rounded-xl bg-slate-50 px-3 text-xs font-medium text-slate-500">
                        {parameter.unit}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between lg:justify-end">
                    {result?.flag ? (
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          result.flag === "normal"
                            ? "bg-emerald-50 text-emerald-700"
                            : result.flag.includes("critical")
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700",
                        ].join(" ")}
                      >
                        {formatFlag(result.flag)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Awaiting result</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function PatientResultPreview({
  patient,
  examination,
  values,
  descriptiveValues,
  manualResult,
  interpretation,
}: {
  patient: LabTechViewProps["patient"];
  examination: MasterTestItem;
  values: Record<string, StructuredResultValue>;
  descriptiveValues: Record<string, string>;
  manualResult: ManualResultDocument;
  interpretation: string;
}) {
  const parameters = examination.subParameters || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          NanoLabs Patient Result
        </div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">{examination.name}</h2>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
          <span>{patient.name}</span>
          {patient.patientNumber && <span>Patient No. {patient.patientNumber}</span>}
          <span>Sample: {examination.sampleType}</span>
        </div>
      </div>

      {manualResult.html ? (
        <div className="prose prose-slate max-w-none p-6" dangerouslySetInnerHTML={{ __html: manualResult.html }} />
      ) : (
        <>
          {parameters.length > 0 && (
            <div className="overflow-x-auto p-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-left">
                    <th className="py-3 pr-4 font-semibold">Parameter</th>
                    <th className="py-3 pr-4 font-semibold">Result</th>
                    <th className="py-3 pr-4 font-semibold">Unit</th>
                    <th className="py-3 font-semibold">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters
                    .filter((parameter) => !isHeading(parameter))
                    .map((parameter) => {
                      const result = values[parameter.id];
                      return (
                        <tr key={parameter.id} className="border-b border-slate-100">
                          <td className="py-3 pr-4">{parameter.name}</td>
                          <td className="py-3 pr-4 font-semibold">
                            {result?.displayValue ?? result?.value ?? "—"}
                          </td>
                          <td className="py-3 pr-4 text-slate-500">{parameter.unit || "—"}</td>
                          <td className="py-3 text-slate-500">
                            {getReferenceRange(parameter, patient.sex) || "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {examination.descriptiveTemplate && Object.keys(descriptiveValues).length > 0 && (
            <div className="space-y-5 p-6">
              {Object.entries(descriptiveValues).map(([id, value]) => {
                const field = examination.descriptiveTemplate?.fields.find((item) => item.id === id);
                if (!field || !value) return null;

                return (
                  <div key={id}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {field.sectionHeader || "Examination"}
                    </div>
                    <div className="mt-1 font-medium text-slate-800">{field.label}</div>
                    <div className="mt-1 whitespace-pre-wrap text-slate-600">{value}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {interpretation && (
        <div className="border-t border-slate-200 bg-slate-50 p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Laboratory Interpretation / Conclusion
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{interpretation}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Optional admin panel.
 *
 * The lab admin can choose:
 * 1. Structured only
 * 2. Manual only
 * 3. Both
 *
 * "Both" is the recommended default because it gives technicians the
 * NanoLabs structured workflow while preserving a manual escape hatch.
 */
export function NanoLabsResultEntrySettings({
  value,
  onChange,
}: {
  value: NanoLabsResultEntrySettings;
  onChange: (next: NanoLabsResultEntrySettings) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Laboratory configuration
        </div>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Result entry workflow</h2>
        <p className="mt-1 text-sm text-slate-500">
          Decide whether technicians use NanoLabs structured forms, manual reports, or both.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {([
          ["structured", "NanoLabs structured", "Recommended for routine tests"],
          ["manual", "Manual reports", "Technician writes the complete result"],
          ["both", "Both modes", "Best flexibility for the laboratory"],
        ] as const).map(([mode, title, description]) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange({ ...value, resultEntryMode: mode })}
            className={[
              "rounded-xl border p-4 text-left transition",
              value.resultEntryMode === mode
                ? "border-slate-900 bg-slate-50 ring-2 ring-slate-100"
                : "border-slate-200 hover:border-slate-400",
            ].join(" ")}
          >
            <div className="font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-xs text-slate-500">{description}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {[
          ["showReferenceRanges", "Show reference ranges to technicians"],
          ["autoFlagResults", "Automatically flag numeric results"],
          ["requireTechnicianReviewBeforeValidation", "Require review before validation"],
          ["allowManualResultForStructuredTests", "Allow manual override on structured tests"],
          ["allowManualResultForDescriptiveTests", "Allow manual override on descriptive exams"],
          ["showPatientPreviewBeforeValidation", "Show patient-result preview before validation"],
        ].map(([key, label]) => {
          const typedKey = key as keyof NanoLabsResultEntrySettings;
          return (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4"
            >
              <span className="pr-4 text-sm font-medium text-slate-700">{label}</span>
              <input
                type="checkbox"
                checked={Boolean(value[typedKey])}
                onChange={(event) =>
                  onChange({
                    ...value,
                    [typedKey]: event.target.checked,
                  })
                }
                className="h-4 w-4"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

export const LabTechView :  React.FC<LabTechViewProps> =({
  patient,
  examination,
  technician,
  settings: incomingSettings,
  existingResult,
  onSaveDraft,
  onSubmitForReview,
  onValidate,
  onCancel,
}) => {
  const settings = { ...DEFAULT_SETTINGS, ...incomingSettings };

  const initialStructured = useMemo(() => {
    const map: Record<string, StructuredResultValue> = {};

    for (const parameter of examination.subParameters || []) {
      const initialValue = getInitialValue(parameter);

      if (initialValue !== null && initialValue !== undefined && initialValue !== "") {
        map[parameter.id] = {
          parameterId: parameter.id,
          value: initialValue,
          displayValue: String(initialValue),
          unit: parameter.unit,
          flag: settings.autoFlagResults
            ? calculateFlag(parameter, typeof initialValue === "string" ? Number(initialValue) : initialValue, patient.sex)
            : undefined,
        };
      }
    }

    return map;
  }, [examination, patient.sex, settings.autoFlagResults]);

  const [entryMode, setEntryMode] = useState<"structured" | "manual">(
    existingResult?.entryMode ||
      (settings.resultEntryMode === "manual" ? "manual" : "structured")
  );

  const [structuredValues, setStructuredValues] =
    useState<Record<string, StructuredResultValue>>(
      existingResult
        ? Object.fromEntries(
            (existingResult.structuredResults || []).map((item) => [item.parameterId, item])
          )
        : initialStructured
    );

  const [descriptiveValues, setDescriptiveValues] =
    useState<Record<string, string>>({});

  const [manualResult, setManualResult] = useState<ManualResultDocument>(
    existingResult?.manualResult || {
      html: "",
      plainText: "",
      updatedAt: nowISO(),
    }
  );

  const [interpretation, setInterpretation] =
    useState(existingResult?.interpretation || "");

  const [technicianNote, setTechnicianNote] =
    useState(existingResult?.technicianNote || "");

  const [status, setStatus] =
    useState<ResultStatus>(existingResult?.status || "draft");

  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canUseManual =
    settings.resultEntryMode === "manual" ||
    settings.resultEntryMode === "both";

  const canUseStructured =
    settings.resultEntryMode === "structured" ||
    settings.resultEntryMode === "both";

  const isDescriptive =
    examination.resultType === "descriptive" ||
    Boolean(examination.descriptiveTemplate);

  const manualAllowedForThisTest =
    isDescriptive
      ? settings.allowManualResultForDescriptiveTests
      : settings.allowManualResultForStructuredTests;

  const updateStructuredValue = (
    parameter: TestSubParameter,
    value: ResultValue
  ) => {
    const flag = settings.autoFlagResults
      ? calculateFlag(
          parameter,
          typeof value === "string" && isNumericParameter(parameter)
            ? Number(value)
            : value,
          patient.sex
        )
      : undefined;

    setStructuredValues((current) => ({
      ...current,
      [parameter.id]: {
        parameterId: parameter.id,
        value,
        displayValue:
          value === null || value === undefined || value === ""
            ? ""
            : String(value),
        unit: parameter.unit,
        flag,
      },
    }));
  };

  const buildResult = (nextStatus: ResultStatus): SavedLabResult => ({
    id: existingResult?.id || crypto.randomUUID(),
    patientId: patient.id,
    examinationId: examination.id,
    examinationCode: examination.code,
    examinationName: examination.name,
    technicianId: technician.id,
    technicianName: technician.name,
    entryMode,
    status: nextStatus,
    structuredResults: Object.values(structuredValues),
    manualResult:
      entryMode === "manual"
        ? manualResult
        : manualResult.html
          ? manualResult
          : undefined,
    interpretation,
    technicianNote,
    createdAt: existingResult?.createdAt || nowISO(),
    updatedAt: nowISO(),
  });

  const save = async (nextStatus: ResultStatus) => {
    setSaving(true);
    setError("");

    try {
      const result = buildResult(nextStatus);

      if (nextStatus === "draft") await onSaveDraft?.(result);
      if (nextStatus === "in_review") await onSubmitForReview?.(result);
      if (nextStatus === "validated") await onValidate?.(result);

      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save result.");
    } finally {
      setSaving(false);
    }
  };

  const completedStructuredCount = Object.values(structuredValues).filter(
    (item) => item.value !== null && item.value !== undefined && item.value !== ""
  ).length;

  const totalStructuredCount = (examination.subParameters || []).filter(
    (parameter) => !isHeading(parameter)
  ).length;

  const manualHasContent = Boolean(manualResult.plainText.trim());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Icon className="h-5 w-5">
                <path d="M9 3h6" />
                <path d="M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3" />
              </Icon>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">NanoLabs Laboratory</div>
              <div className="truncate text-xs text-slate-500">Result entry workstation</div>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-sm md:flex">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              Technician: {technician.name}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              {status === "draft"
                ? "Draft"
                : status === "in_review"
                  ? "In review"
                  : "Validated"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Patient
                  </div>
                  <h1 className="mt-1 text-2xl font-bold">{patient.name}</h1>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                    {patient.patientNumber && (
                      <span>Patient No. {patient.patientNumber}</span>
                    )}
                    {patient.sex && <span>• {patient.sex}</span>}
                    {patient.dateOfBirth && <span>• DOB {patient.dateOfBirth}</span>}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 md:min-w-64">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Examination
                  </div>
                  <div className="mt-1 font-semibold">{examination.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {examination.code} • {examination.sampleType}
                  </div>
                </div>
              </div>

              {examination.conditions && (
                <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                  <span className="font-semibold">Collection / test conditions:</span>{" "}
                  {examination.conditions}
                </div>
              )}
            </div>

            {settings.resultEntryMode === "both" && canUseManual && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div>
                  <div className="text-sm font-semibold">Result entry method</div>
                  <div className="text-xs text-slate-500">
                    Use the guided NanoLabs form or write the complete laboratory report manually.
                  </div>
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    disabled={!canUseStructured}
                    onClick={() => setEntryMode("structured")}
                    className={[
                      "rounded-lg px-4 py-2 text-sm font-medium",
                      entryMode === "structured"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    Structured form
                  </button>

                  <button
                    type="button"
                    disabled={!manualAllowedForThisTest}
                    onClick={() => setEntryMode("manual")}
                    className={[
                      "rounded-lg px-4 py-2 text-sm font-medium",
                      entryMode === "manual"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    Manual report
                  </button>
                </div>
              </div>
            )}

            {entryMode === "structured" ? (
              <div className="space-y-6">
                {examination.subParameters?.length ? (
                  <StructuredResultForm
                    examination={examination}
                    patientSex={patient.sex}
                    values={structuredValues}
                    onChange={updateStructuredValue}
                    showReferenceRanges={settings.showReferenceRanges}
                  />
                ) : null}

                {examination.descriptiveTemplate && (
                  <DescriptiveSection
                    template={examination.descriptiveTemplate}
                    values={descriptiveValues}
                    onChange={(id, value) =>
                      setDescriptiveValues((current) => ({
                        ...current,
                        [id]: value,
                      }))
                    }
                  />
                )}

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <label className="text-sm font-semibold text-slate-800">
                    Laboratory interpretation / conclusion
                  </label>
                  <textarea
                    value={interpretation}
                    onChange={(event) => setInterpretation(event.target.value)}
                    rows={4}
                    placeholder="Enter the laboratory interpretation or conclusion..."
                    className="mt-3 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </section>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <div className="font-semibold">Manual result mode</div>
                  <p className="mt-1">
                    Write the complete result exactly as the laboratory wants it to appear
                    to the patient. Formatting is preserved in the patient result.
                  </p>
                </div>

                <ManualRichTextEditor
                  value={manualResult}
                  onChange={setManualResult}
                />

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <label className="text-sm font-semibold text-slate-800">
                    Additional laboratory interpretation / conclusion
                  </label>
                  <textarea
                    value={interpretation}
                    onChange={(event) => setInterpretation(event.target.value)}
                    rows={3}
                    placeholder="Optional conclusion..."
                    className="mt-3 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </section>
              </div>
            )}

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="text-sm font-semibold text-slate-800">
                Technician note
              </label>
              <textarea
                value={technicianNote}
                onChange={(event) => setTechnicianNote(event.target.value)}
                rows={3}
                placeholder="Internal note for laboratory staff. This can be kept separate from the patient-facing result."
                className="mt-3 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />
            </section>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <div className="flex flex-wrap gap-2">
                {settings.showPatientPreviewBeforeValidation && (
                  <button
                    type="button"
                    onClick={() => setShowPreview((current) => !current)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {showPreview ? "Hide patient preview" : "Preview patient result"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save("draft")}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Save draft
                </button>

                {settings.requireTechnicianReviewBeforeValidation ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => save("in_review")}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Submit for review
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => save("validated")}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Validate result
                  </button>
                )}
              </div>
            </div>

            {showPreview && (
              <div className="mt-6">
                <PatientResultPreview
                  patient={patient}
                  examination={examination}
                  values={structuredValues}
                  descriptiveValues={descriptiveValues}
                  manualResult={manualResult}
                  interpretation={interpretation}
                />
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Examination summary
              </div>

              <h2 className="mt-2 text-lg font-bold text-slate-900">
                {examination.name}
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Code</span>
                  <span className="font-medium">{examination.code}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Category</span>
                  <span className="text-right font-medium">{examination.category}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Sample</span>
                  <span className="text-right font-medium">{examination.sampleType}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Turnaround</span>
                  <span className="font-medium">{examination.turnaroundTime}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Entry type</span>
                  <span className="font-medium capitalize">{entryMode}</span>
                </div>
              </div>

              {entryMode === "structured" && totalStructuredCount > 0 && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-end justify-between">
                    <span className="text-xs font-medium text-slate-500">Structured completion</span>
                    <span className="text-sm font-bold">
                      {completedStructuredCount}/{totalStructuredCount}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (completedStructuredCount / totalStructuredCount) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Report destination
                </div>
                <div className="mt-2 flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 text-emerald-600">
                    <path d="M20 6 9 17l-5-5" />
                  </Icon>
                  <div className="text-sm text-slate-600">
                    The validated result becomes the result visible in the patient's
                    NanoLabs result record, subject to your laboratory's authorization workflow.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="font-semibold text-blue-950">Technician safety net</div>
              <p className="mt-2 text-sm leading-6 text-blue-900">
                If the structured form does not match how your laboratory actually performs
                an examination, switch to Manual report instead of forcing the technician
                into an incorrect template.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

/**
 * Convenience helper for pages that receive an examination code.
 */
export function getNanoLabsExaminationByCode(code: string) {
  return MASTER_TESTS_CATALOG.find((test) => test.code === code);
}

/**
 * Convenience helper for pages that receive an examination ID.
 */
export function getNanoLabsExaminationById(id: string) {
  return MASTER_TESTS_CATALOG.find((test) => test.id === id);
}
