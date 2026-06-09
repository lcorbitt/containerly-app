"use client";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

export const profileImagePathAtom = atom<string | null>(null);

export function useInitializeProfileImagePath(initialProfileImagePath: string | null) {
  const setProfileImagePath = useSetAtom(profileImagePathAtom);

  useEffect(() => {
    setProfileImagePath(initialProfileImagePath);
  }, [initialProfileImagePath, setProfileImagePath]);
}

export function useSessionAvatar() {
  const profileImagePath = useAtomValue(profileImagePathAtom);
  const setProfileImagePath = useSetAtom(profileImagePathAtom);
  return { profileImagePath, setProfileImagePath };
}
