"use client";

import { useInitializeProfileImagePath } from "@/atoms/session-avatar";

interface SessionAvatarInitProps {
  initialProfileImagePath: string | null;
}

export function SessionAvatarInit({ initialProfileImagePath }: SessionAvatarInitProps) {
  useInitializeProfileImagePath(initialProfileImagePath);
  return null;
}
