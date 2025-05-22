import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, CheckSquare, DollarSign, Users } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    activeProjects: number;
    pendingTasks: number;
    monthlyRevenue: string;
    activeClients: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Projetos Ativos",
      value: stats?.activeProjects || 0,
      icon: FolderOpen,
      color: "bg-blue-500",
    },
    {
      title: "Tarefas Pendentes",
      value: stats?.pendingTasks || 0,
      icon: CheckSquare,
      color: "bg-yellow-500",
    },
    {
      title: "Receita Mensal",
      value: `R$ ${parseFloat(stats?.monthlyRevenue || "0").toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Clientes Ativos",
      value: stats?.activeClients || 0,
      icon: Users,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden shadow">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${card.color} rounded-md flex items-center justify-center`}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {card.value}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
