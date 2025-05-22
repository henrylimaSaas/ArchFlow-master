import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  
  // Busca os dados do usuário do nosso banco
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!clerkUser && isLoaded,
    retry: false,
  });

  return {
    user,
    clerkUser,
    isLoading: !isLoaded || isUserLoading,
    isAuthenticated: !!clerkUser && !!user,
  };
}
