import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  Home,
  FolderOpen,
  CheckSquare,
  TrendingUp,
  Users,
  Calculator,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projetos", href: "/projects", icon: FolderOpen },
  { name: "Tarefas", href: "/tasks", icon: CheckSquare },
  { name: "Financeiro", href: "/finances", icon: TrendingUp },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Calculadora", href: "/calculator", icon: Calculator },
];

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    authService.logout();
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">ArchFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || 
            (item.href === "/dashboard" && location === "/");
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={`
                  ${isActive
                    ? "bg-green-50 border-r-4 border-green-600 text-green-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                  group flex items-center px-2 py-2 text-sm font-medium rounded-l-md
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={`
                    ${isActive ? "text-green-500" : "text-gray-400 group-hover:text-gray-500"}
                    mr-3 h-5 w-5
                  `}
                />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center w-full">
          <div className="flex items-center flex-1">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-green-100 text-green-600">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs font-medium text-gray-500 capitalize">
                {user?.role === "admin" ? "Administrador" : user?.role}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full text-white hover:bg-gray-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 h-0 overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
