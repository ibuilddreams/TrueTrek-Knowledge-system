import {
  Camera,
  Heart,
  MessageSquare,
  PenLine,
  Search,
  UserRound,
} from "lucide-react";

// Mirrors quests.models.Quest.Category — the backend sends both the raw key
// and its display label, so this map only supplies the icon/tone the label
// can't carry.
export const QUEST_CATEGORY_META = {
  AUDIT: { icon: Search, tone: "bg-cn-p-warn-bg text-cn-p-warn border-transparent" },
  CONTENT: { icon: Camera, tone: "bg-cn-p-soft text-cn-p-soft-ink border-transparent" },
  ENGAGEMENT: { icon: Heart, tone: "bg-cn-p-bad-bg text-cn-p-bad border-transparent" },
  PROFILE: { icon: UserRound, tone: "bg-cn-p-neutral-bg text-cn-p-ink border-transparent" },
  OUTREACH: { icon: MessageSquare, tone: "bg-cn-p-warn-bg text-cn-p-warn border-transparent" },
  REFLECTION: { icon: PenLine, tone: "bg-cn-p-soft text-cn-p-soft-ink border-transparent" },
};

export const QUEST_DIFFICULTY_TONE = {
  EASY: "bg-cn-p-soft text-cn-p-soft-ink border-transparent",
  MEDIUM: "bg-cn-p-warn-bg text-cn-p-warn border-transparent",
  HARD: "bg-cn-p-bad-bg text-cn-p-bad border-transparent",
};

export function getQuestCategoryMeta(category) {
  return QUEST_CATEGORY_META[category] || QUEST_CATEGORY_META.CONTENT;
}
