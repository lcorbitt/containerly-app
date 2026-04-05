"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SessionAvatarContextValue = {
  profileImagePath: string | null;
  setProfileImagePath: (path: string | null) => void;
};

const SessionAvatarContext = createContext<SessionAvatarContextValue | null>(
  null,
);

export function SessionAvatarProvider({
  children,
  initialProfileImagePath,
}: {
  children: ReactNode;
  initialProfileImagePath: string | null;
}) {
  const [profileImagePath, setProfileImagePathState] = useState<string | null>(
    initialProfileImagePath,
  );

  const setProfileImagePath = useCallback((path: string | null) => {
    setProfileImagePathState(path);
  }, []);

  const value = useMemo(
    () => ({ profileImagePath, setProfileImagePath }),
    [profileImagePath, setProfileImagePath],
  );

  return (
    <SessionAvatarContext.Provider value={value}>
      {children}
    </SessionAvatarContext.Provider>
  );
}

export function useSessionAvatar(): SessionAvatarContextValue {
  const ctx = useContext(SessionAvatarContext);
  if (!ctx) {
    throw new Error("useSessionAvatar requires SessionAvatarProvider");
  }
  return ctx;
}

/** Safe when used outside provider (e.g. tests); no-op if missing. */
export function useOptionalSessionAvatar(): SessionAvatarContextValue | null {
  return useContext(SessionAvatarContext);
}
