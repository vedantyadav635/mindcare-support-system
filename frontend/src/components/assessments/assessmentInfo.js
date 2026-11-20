/** What we show for each self-check, and how a severity band is worded (gently, never as an alarm). */
import { ClipboardList, HeartPulse } from "lucide-react";

export const ASSESSMENTS = {
  PHQ9: {
    name: "Mood check",
    short: "PHQ-9",
    questions: 9,
    maxScore: 27,
    tint: "peach",
    icon: ClipboardList,
    about: "Asks about interest, energy, sleep and mood over the last two weeks.",
  },
  GAD7: {
    name: "Anxiety check",
    short: "GAD-7",
    questions: 7,
    maxScore: 21,
    tint: "lilac",
    icon: HeartPulse,
    about: "Asks about worry, feeling on edge and restlessness over the last two weeks.",
  },
};

export const COMPLETION_TIME = "About 2 minutes";

/** band (from the backend) -> badge colour, label and one gentle sentence. No red alarm colours. */
export const BANDS = {
  minimal: { badge: "success", label: "Minimal", words: "Few signs right now." },
  mild: { badge: "info", label: "Mild", words: "Some signs, nothing overwhelming." },
  moderate: { badge: "warning", label: "Moderate", words: "There's a fair amount going on." },
  "moderately severe": { badge: "brand", label: "Moderately severe", words: "A lot is weighing on you." },
  severe: { badge: "brand", label: "Severe", words: "Things feel very heavy right now." },
};

export const bandInfo = (band) => BANDS[band] ?? { badge: "neutral", label: band, words: "" };

export const SCREENING_NOTE =
  "This is a screening aid for awareness only. It is not a diagnosis. Only a qualified professional can assess your mental health.";
