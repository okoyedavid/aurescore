import { useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/account/hooks";
import { authApi } from "./api";

export function useAuthUser() {
  return useCurrentUser();
}

export function useRegister() {
  return useMutation({ mutationFn: authApi.register });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: authApi.verifyEmail });
}

export function useResendEmailVerification() {
  return useMutation({ mutationFn: authApi.resendEmailVerification });
}

export function useLogin() {
  return useMutation({ mutationFn: authApi.login });
}

export function useVerifyLogin() {
  return useMutation({ mutationFn: authApi.verifyLogin });
}

export function useResendLoginVerification() {
  return useMutation({ mutationFn: authApi.resendLoginVerification });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: authApi.requestPasswordReset,
    retry: false,
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: authApi.confirmPasswordReset,
    retry: false,
  });
}

export function useLogout() {
  return useMutation({ mutationFn: authApi.logout, retry: false });
}
