/** One place for how each resource type looks: icon, card colour, card label and filter-chip label. */
import { Activity, BookOpen, HeartHandshake, Moon, Video, Wind } from "lucide-react";

export const TYPE_INFO = {
  breathing: { icon: Wind, tint: "sky", label: "Breathing", filter: "Breathing" },
  sleep: { icon: Moon, tint: "lilac", label: "Sleep", filter: "Sleep" },
  article: { icon: BookOpen, tint: "sun", label: "Read", filter: "Articles" },
  video: { icon: Video, tint: "blush", label: "Watch", filter: "Videos" },
  activity: { icon: Activity, tint: "peach", label: "Try this", filter: "Activities" },
  counselling: { icon: HeartHandshake, tint: "mint", label: "Counselling", filter: "Counselling" },
};

/** Order of the filter chips on the library. */
export const FILTER_ORDER = ["breathing", "sleep", "article", "video", "activity", "counselling"];

export const typeInfo = (type) => TYPE_INFO[type] ?? TYPE_INFO.activity;

/** "low_mood" -> "Low mood" */
export const tagLabel = (tag) => {
  const text = tag.replaceAll("_", " ");
  return text[0].toUpperCase() + text.slice(1);
};
