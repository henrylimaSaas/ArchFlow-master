import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Middleware para verificar autenticação com Clerk
export async function clerkAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    // Verifica o token JWT do Clerk
    const decoded = await clerkClient.verifyToken(token);
    
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: "Token inválido" });
    }

    // Adiciona o ID do usuário à requisição
    (req as any).userId = decoded.sub;
    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(401).json({ message: "Não autorizado" });
  }
}

// Função para sincronizar usuário do Clerk com nosso banco
export async function syncUserWithClerk(clerkUserId: string) {
  try {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    
    return {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      profileImageUrl: clerkUser.profileImageUrl || "",
    };
  } catch (error) {
    console.error("Erro ao sincronizar usuário:", error);
    throw error;
  }
}