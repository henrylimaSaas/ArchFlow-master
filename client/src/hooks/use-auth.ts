import { useQuery } from "@tanstack/react-query";
import { authService, type AuthUser } from "@/lib/auth";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
