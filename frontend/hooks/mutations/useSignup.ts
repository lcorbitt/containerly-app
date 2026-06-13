import { useMutation } from "@tanstack/react-query";
import { submitSignup } from "@/services/signup.service";

export function useSubmitSignupMutation() {
  return useMutation({
    mutationFn: submitSignup,
  });
}
