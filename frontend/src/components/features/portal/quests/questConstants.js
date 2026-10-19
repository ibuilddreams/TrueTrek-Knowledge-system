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
  AUDIT: { icon: Search, tone: "bg-gold/12 text-gold border-gold/25" },
  CONTENT: { icon: Camera, tone: "bg-sage/40 text-pine border-pine/20" },
  ENGAGEMENT: { icon: Heart, tone: "bg-rose/35 text-clay border-clay/20" },
  PROFILE: { icon: UserRound, tone: "bg-porcelain text-ink border-line" },
  OUTREACH: { icon: MessageSquare, tone: "bg-gold/12 text-gold border-gold/25" },
  REFLECTION: { icon: PenLine, tone: "bg-sage/40 text-pine border-pine/20" },
};

export const QUEST_DIFFICULTY_TONE = {
  EASY: "bg-sage/40 text-pine border-pine/20",
  MEDIUM: "bg-gold/12 text-gold border-gold/25",
  HARD: "bg-rose/35 text-clay border-clay/25",
};

export function getQuestCategoryMeta(category) {
  return QUEST_CATEGORY_META[category] || QUEST_CATEGORY_META.CONTENT;
}
