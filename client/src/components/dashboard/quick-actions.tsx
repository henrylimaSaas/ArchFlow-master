import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Receipt, Calculator } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Novo Projeto",
      icon: Plus,
      color: "text-green-600",
      href: "/projects",
    },
    {
      title: "Novo Cliente",
      icon: UserPlus,
      color: "text-blue-600",
      href: "/clients",
    },
    {
      title: "Nova Receita",
      icon: Receipt,
      color: "text-green-600",
      href: "/finances",
    },
    {
      title: "Calculadora",
      icon: Calculator,
      color: "text-purple-600",
      href: "/calculator",
    },
  ];

  return (
    <div>
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
        Ações Rápidas
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant="outline"
            className="relative block w-full p-6 border border-gray-300 border-dashed rounded-lg text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 h-auto"
            onClick={() => window.location.href = action.href}
          >
            <action.icon className={`${action.color} text-2xl mb-2 mx-auto`} />
            <span className="block text-sm font-medium text-gray-900">
              {action.title}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
