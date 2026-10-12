import {
  Award, BookOpen, Briefcase, Code, Crown, Factory, FileText, Flag, Gift, GraduationCap,
  Handshake, Heart, House, Landmark, Leaf, Lightbulb, Megaphone, Mountain, Music,
  Presentation, Rocket, Sparkles, Star, Swords, Trophy, Users, Wrench, Zap,
  type LucideIcon,
} from "lucide-react";
import type { LevelIcon } from "@/lib/journey";

export const LEVEL_ICONS: Record<LevelIcon, LucideIcon> = {
  flag: Flag, users: Users, trophy: Trophy, music: Music, heart: Heart, wrench: Wrench,
  leaf: Leaf, code: Code, award: Award, megaphone: Megaphone, swords: Swords, home: House,
  handshake: Handshake, landmark: Landmark, crown: Crown, file: FileText, zap: Zap,
  factory: Factory, book: BookOpen, lightbulb: Lightbulb, sparkles: Sparkles,
  briefcase: Briefcase, rocket: Rocket, graduation: GraduationCap, presentation: Presentation,
  star: Star, gift: Gift, mountain: Mountain,
};

export const CATEGORY_STYLE: Record<string, { label: string; color: string; soft: string; icon: LucideIcon }> = {
  technical: { label: "Technical", color: "#1877C9", soft: "#E3F1FD", icon: Code },
  cultural: { label: "Cultural", color: "#8B5CF6", soft: "#EFE8FE", icon: Music },
  sports: { label: "Sports", color: "#E2620A", soft: "#FFEEDD", icon: Trophy },
  "community service": { label: "Community", color: "#D43D6F", soft: "#FDE6EE", icon: Heart },
  professional: { label: "Professional", color: "#4F46E5", soft: "#E8E7FD", icon: Briefcase },
  "national initiative": { label: "National", color: "#17803F", soft: "#E2F6EA", icon: Landmark },
};

export function categoryStyle(category?: string) {
  return CATEGORY_STYLE[(category || "").toLowerCase()] ?? { label: category || "Other", color: "#4B5B73", soft: "#EAF2FA", icon: Star };
}
