import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentProjects from "@/components/dashboard/recent-projects";
import PendingTasks from "@/components/dashboard/pending-tasks";
import FinancialOverview from "@/components/dashboard/financial-overview";
import QuickActions from "@/components/dashboard/quick-actions";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  if (statsLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-5 shadow rounded-lg">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Bem-vindo de volta, {user?.firstName}! Aqui está o resumo dos seus projetos.
            </p>
          </div>
        </div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Main content grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentProjects 
            projects={projects?.slice(0, 5) || []} 
            isLoading={projectsLoading} 
          />
          <PendingTasks 
            tasks={tasks?.filter(task => task.status === 'todo').slice(0, 5) || []} 
            isLoading={tasksLoading} 
          />
        </div>

        {/* Financial Overview */}
        <div className="mt-8">
          <FinancialOverview 
            transactions={transactions || []} 
            isLoading={transactionsLoading} 
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
