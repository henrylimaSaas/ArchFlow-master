import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService, type RegisterData } from "@/lib/auth";
import { Building2, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
    office: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    user: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.register(formData);
      
      toast({
        title: "Registro realizado com sucesso",
        description: "Bem-vindo ao ArchFlow!",
      });

      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Erro no registro",
        description: "Não foi possível criar a conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOffice = (field: string, value: string) => {
    setFormData({
      ...formData,
      office: { ...formData.office, [field]: value },
    });
  };

  const updateUser = (field: string, value: string) => {
    setFormData({
      ...formData,
      user: { ...formData.user, [field]: value },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
            <CardDescription>
              Registre seu escritório no ArchFlow
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Office Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações do Escritório</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="office-name">Nome do Escritório *</Label>
                  <Input
                    id="office-name"
                    type="text"
                    placeholder="Escritório de Arquitetura XYZ"
                    value={formData.office.name}
                    onChange={(e) => updateOffice("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office-email">E-mail do Escritório *</Label>
                  <Input
                    id="office-email"
                    type="email"
                    placeholder="contato@escritorio.com"
                    value={formData.office.email}
                    onChange={(e) => updateOffice("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office-phone">Telefone</Label>
                  <Input
                    id="office-phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.office.phone}
                    onChange={(e) => updateOffice("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office-address">Endereço</Label>
                  <Input
                    id="office-address"
                    type="text"
                    placeholder="Rua das Flores, 123"
                    value={formData.office.address}
                    onChange={(e) => updateOffice("address", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados do Administrador</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Nome *</Label>
                  <Input
                    id="first-name"
                    type="text"
                    placeholder="João"
                    value={formData.user.firstName}
                    onChange={(e) => updateUser("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Sobrenome *</Label>
                  <Input
                    id="last-name"
                    type="text"
                    placeholder="Silva"
                    value={formData.user.lastName}
                    onChange={(e) => updateUser("lastName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">E-mail Pessoal *</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="joao@email.com"
                    value={formData.user.email}
                    onChange={(e) => updateUser("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário *</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="joao.silva"
                    value={formData.user.username}
                    onChange={(e) => updateUser("username", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite uma senha segura"
                      value={formData.user.password}
                      onChange={(e) => updateUser("password", e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="font-medium text-green-600 hover:text-green-500"
              >
                Fazer login
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
