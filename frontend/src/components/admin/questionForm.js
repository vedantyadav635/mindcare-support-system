/**
 * Pure logic for the check-in question editor (no React): form state <-> API body, instant checks, and reordering.
 * The checks mirror the backend's rules so the admin gets feedback while typing, but the backend has the last word.
 */

// metric -> [lowest, highest, whole numbers only]
export const METRIC_RANGE = { mood: [1, 5, true], stress: [1, 5, true], sleep: [0, 24, false] };
export const METRIC_HINT = "Mood and stress use whole numbers from 1 to 5. Sleep uses hours from 0 to 24.";

const blankOptions = () => [{ label: "", value: "" }, { label: "", value: "" }];
const isNumber = (text) => text.trim() !== "" && Number.isFinite(Number(text));

/** A fresh form for "Add question". */
export const emptyForm = (displayOrder) => ({
  text: "",
  answer_type: "option",
  options: blankOptions(),
  metric: "none",
  is_required: true,
  max_length: "300",
  display_order: displayOrder,
});

/** A question from the API -> form state (numbers become text, because they are typed into inputs). */
export const fromQuestion = (q) => ({
  text: q.text,
  answer_type: q.answer_type,
  options: q.options?.length ? q.options.map((o) => ({ label: o.label, value: String(o.value) })) : blankOptions(),
  metric: q.metric,
  is_required: q.is_required,
  max_length: String(q.max_length ?? 300),
  display_order: q.display_order,
});

/** Instant checks. Returns { text?, options?, maxLength? } (empty object = fine). */
export function validate(form) {
  const errors = {};
  if (!form.text.trim()) errors.text = "Write the question.";

  if (form.answer_type === "text") {
    const length = Number(form.max_length);
    if (!Number.isInteger(length) || length < 1 || length > 2000) errors.maxLength = "Use a whole number from 1 to 2000.";
    return errors;
  }

  const { options, metric } = form;
  if (options.length < 2) errors.options = "Add at least 2 options.";
  else if (options.some((o) => !o.label.trim())) errors.options = "Every option needs a label.";
  else if (options.some((o) => !isNumber(o.value))) errors.options = "Every option needs a number as its value.";
  else {
    const values = options.map((o) => Number(o.value));
    if (new Set(values).size !== values.length) errors.options = "Each option needs a different value.";
    else if (METRIC_RANGE[metric]) {
      const [low, high, whole] = METRIC_RANGE[metric];
      if (values.some((v) => v < low || v > high)) errors.options = `Values for ${metric} must be between ${low} and ${high}.`;
      else if (whole && values.some((v) => !Number.isInteger(v))) errors.options = `Values for ${metric} must be whole numbers.`;
    }
  }
  return errors;
}

/** Form state -> the body for POST / PUT /admin/checkin/questions. */
export function toBody(form, { isActive = true } = {}) {
  const isOption = form.answer_type === "option";
  return {
    text: form.text.trim(),
    answer_type: form.answer_type,
    options: isOption ? form.options.map((o) => ({ label: o.label.trim(), value: Number(o.value) })) : null,
    metric: isOption ? form.metric : "none", // only option questions can have a metric
    is_required: form.is_required,
    max_length: isOption ? null : Number(form.max_length),
    display_order: form.display_order,
    is_active: isActive,
  };
}

/** What the check-in screen needs to draw this question: only complete option rows are shown. */
export function previewQuestion(form) {
  const complete = form.options.filter((o) => o.label.trim() && isNumber(o.value));
  return {
    id: 0,
    text: form.text.trim() || "Your question appears here",
    answer_type: form.answer_type,
    options: complete.map((o) => ({ label: o.label.trim(), value: Number(o.value) })),
    metric: form.answer_type === "option" ? form.metric : "none",
    is_required: form.is_required,
    max_length: Number(form.max_length) || 300,
  };
}

/** An existing question (from the API) -> a full PUT body, with some fields changed. */
export const bodyFrom = (q, changes = {}) => ({
  text: q.text,
  answer_type: q.answer_type,
  options: q.options,
  metric: q.metric,
  is_required: q.is_required,
  max_length: q.max_length,
  display_order: q.display_order,
  is_active: q.is_active,
  ...changes,
});

/**
 * Move question `index` one place up (-1) or down (+1). Returns only the questions whose display_order
 * must change, numbered 1..n. (Renumbering everything also fixes lists where several questions share an order.)
 */
export function reorderChanges(questions, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= questions.length) return [];
  const next = [...questions];
  [next[index], next[target]] = [next[target], next[index]];
  return next
    .map((question, i) => ({ question, display_order: i + 1 }))
    .filter(({ question, display_order }) => question.display_order !== display_order);
}

/** The next free position for a new question (after the last). */
export const nextOrder = (questions) => Math.max(0, ...questions.map((q) => q.display_order)) + 1;
