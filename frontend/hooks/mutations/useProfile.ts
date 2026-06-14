import { useMutation } from "@tanstack/react-query";
import { updateProfilePlatformRole } from "@/services/profile.service";
import type { Profile } from "@/types/database";

export function useUpdateProfilePlatformRoleMutation() {
  return useMutation({
    mutationFn: (input: { profileId: string; role: Profile["role"] }) =>
      updateProfilePlatformRole(input.profileId, input.role),
  });
}
