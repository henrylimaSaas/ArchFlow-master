import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, Plus, Mail, UserPlus } from "lucide-react";
import TeamMemberForm from "@/components/team/team-member-form";
import type { User } from "@shared/schema";

export default function Team() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/users"],
  });

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "architect":
        return "Arquiteto";
      case "intern":
        return "Estagiário";
      case "financial":
        return "Financeiro";
      case "marketing":
        return "Marketing";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "architect":
        return "bg-blue-100 text-blue-800";
      case "intern":
        return "bg-green-100 text-green-800";
      case "financial":
        return "bg-yellow-100 text-yellow-800";
      case "marketing":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = users.filter((user: User) =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da sua equipe e suas funções
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Membro da Equipe</DialogTitle>
            </DialogHeader>
            <TeamMemberForm
              onSuccess={() => {
                setIsFormOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar membros da equipe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{filteredUsers.length} membros</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "Nenhum membro encontrado" : "Nenhum membro cadastrado"}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm 
                ? "Tente ajustar os termos de busca."
                : "Adicione membros à sua equipe para começar a colaborar em projetos."
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsFormOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Membro
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user: User) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium text-lg">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.username
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleText(user.role)}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMember(user);
                        setIsFormOpen(true);
                      }}
                      className="flex-1"
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para editar membro */}
      <Dialog 
        open={isFormOpen && !!editingMember} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingMember(null);
            setIsFormOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Membro da Equipe</DialogTitle>
          </DialogHeader>
          <TeamMemberForm
            user={editingMember}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingMember(null);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}