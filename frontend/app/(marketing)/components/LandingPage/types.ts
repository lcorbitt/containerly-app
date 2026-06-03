import type { LucideIcon } from "lucide-react";

export interface FeatureCard {
  icon: LucideIcon;
  title: string;
  body: string;
}

export interface PainBullet {
  text: string;
}

export interface Step {
  n: string;
  title: string;
  body: string;
}

export interface AutomationExample {
  title: string;
  body: string;
}

export interface AudienceCard {
  label: string;
  headline: string;
  pain: string;
  outcome: string;
}
