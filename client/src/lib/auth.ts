import { apiRequest } from "@/lib/queryClient";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  office: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  user: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  office?: any;
  isSuperAdmin?: boolean;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    
    return data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/register-office", data);
    const result = await response.json();
    
    if (result.token) {
      localStorage.setItem("token", result.token);
    }
    
    return result;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      localStorage.removeItem("token");
      return null;
    }
  },

  logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
