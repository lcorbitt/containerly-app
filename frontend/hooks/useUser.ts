"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserAuthSession, subscribeToAuthState } from "@/services/auth.service";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getBrowserAuthSession().then((session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const unsubscribe = subscribeToAuthState((_signedIn, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    signedIn: Boolean(user),
  };
}
