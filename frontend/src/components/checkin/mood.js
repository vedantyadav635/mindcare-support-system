/** Mood scale 1 (very low) .. 5 (very good): a face and a token colour for each value. */
export const MOOD_EMOJI = { 1: "😞", 2: "🙁", 3: "😐", 4: "🙂", 5: "😄" };

export const MOOD_LABELS = { 1: "Very low", 2: "Low", 3: "Okay", 4: "Good", 5: "Very good" };

// Full class names so Tailwind generates them (colours are the --color-mood-* tokens)
export const MOOD_SWATCH = { 1: "bg-mood-1", 2: "bg-mood-2", 3: "bg-mood-3", 4: "bg-mood-4", 5: "bg-mood-5" };
