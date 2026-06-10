import type { SpriteAction } from "@/components/ui/sprite-animation";

export function moodToAction(mood: string): SpriteAction {
  if (mood === "sleep" || mood === "sad") {
    return "alert";
  }
  if (mood === "yawn") {
    return "thinking";
  }
  if (mood === "happy") {
    return "happy";
  }
  return "idle";
}
