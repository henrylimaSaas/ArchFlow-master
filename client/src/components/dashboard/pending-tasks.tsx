import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Task } from "@shared/schema";

interface PendingTasksProps {
  tasks: Task[];
  isLoading: boolean;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "h-2 w-2 bg-red-400 rounded-full";
    case "medium":
      return "h-2 w-2 bg-yellow-400 rounded-full";
    case "low":
      return "h-2 w-2 bg-green-400 rounded-full";
    default:
      return "h-2 w-2 bg-gray-400 rounded-full";
  }
};

const formatDueDate = (dueDate: string | null) => {
  if (!dueDate) return "Sem prazo";
  
  const date = new Date(dueDate);
  const now = new Date();
  
  if (date < now) {
    return "Vencida";
  }
  
  return formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: ptBR 
  });
};

export default function PendingTasks({ tasks, isLoading }: PendingTasksProps) {
  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader>
          <CardTitle>Tarefas Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Tarefas Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma tarefa pendente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={getPriorityColor(task.priority)}></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Projeto ID: {task.projectId || "Sem projeto"}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDueDate(task.dueDate)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6">
          <Link href="/tasks">
            <Button variant="outline" className="w-full">
              Ver quadro de tarefas
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
