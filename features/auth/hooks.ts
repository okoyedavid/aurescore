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
