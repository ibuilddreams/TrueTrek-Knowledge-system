import {
  BookMarked,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Compass,
  GraduationCap,
  KeyRound,
  Layers,
  LifeBuoy,
  LineChart,
  MessagesSquare,
  Presentation,
  Rocket,
  Sparkles,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

/**
 * Resolves the icon keys used in `constants/userGuides.js`, which stays free of
 * component imports — same split as `FAQ_CATEGORIES` and its `CATEGORY_ICONS`.
 */
const GUIDE_ICONS = {
  BookMarked,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Compass,
  GraduationCap,
  KeyRound,
  Layers,
  LifeBuoy,
  LineChart,
  MessagesSquare,
  Presentation,
  Rocket,
  Sparkles,
  Trophy,
  UserRound,
  Users,
};

export function getGuideIcon(name) {
  return GUIDE_ICONS[name] ?? BookOpen;
}

export default GUIDE_ICONS;
