import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Clock, AlertTriangle, CheckCircle, Plus, Edit2, Trash2, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TaskForm from "./task-form";
import type { Task, Project, User } from "@shared/schema";

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  onTaskUpdate: () => void;
}

const columns = [
  { id: "todo", title: "A Fazer", color: "bg-gray-100", icon: Clock },
  { id: "in_progress", title: "Em Andamento", color: "bg-blue-100", icon: AlertTriangle },
  { id: "done", title: "Concluído", color: "bg-green-100", icon: CheckCircle },
];

export default function KanbanBoard({ tasks, projects, users, onTaskUpdate }: KanbanBoardProps) {
  const { toast } = useToast();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedColumnStatus, setSelectedColumnStatus] = useState<string>("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      return apiRequest("PUT", `/api/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Tarefa atualizada",
        description: "O status da tarefa foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a tarefa.",
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return priority;
    }
  };

  const getProjectName = (projectId: number | null) => {
    if (!projectId) return "Sem projeto";
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Projeto não encontrado";
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return "Não atribuído";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Usuário não encontrado";
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== newStatus) {
      updateTaskMutation.mutate({
        taskId: draggedTask.id,
        status: newStatus,
      });
    }
    
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        const IconComponent = column.icon;
        
        return (
          <Card key={column.id} className="h-fit">
            <CardHeader className={`${column.color} pb-3`}>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <IconComponent className="w-5 h-5" />
                  <span>{column.title}</span>
                </div>
                <Badge variant="secondary" className="bg-white">
                  {columnTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent
              className="p-4 min-h-[500px] space-y-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <IconComponent className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-move hover:shadow-md transition-shadow border-l-4 border-l-gray-300"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight">
                            {task.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityText(task.priority)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTask(task);
                                    setIsEditFormOpen(true);
                                  }}
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir a tarefa "{task.title}"? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTaskMutation.mutate(task.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">
                            📁 {getProjectName(task.projectId)}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            👤 {getUserName(task.assignedTo)}
                          </div>
                          
                          {task.dueDate && (
                            <div className={`text-xs flex items-center space-x-1 ${
                              isOverdue(task.dueDate) ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>
                                {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                                {isOverdue(task.dueDate) && " (Vencida)"}
                              </span>
                            </div>
                          )}
                        </div>

                        {task.parentTaskId && (
                          <Badge variant="outline" className="text-xs">
                            Subtarefa
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              
              <Dialog open={isFormOpen && selectedColumnStatus === column.id} onOpenChange={(open) => {
                if (!open) {
                  setIsFormOpen(false);
                  setSelectedColumnStatus("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400"
                    onClick={() => {
                      setSelectedColumnStatus(column.id);
                      setIsFormOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Tarefa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nova Tarefa - {column.title}</DialogTitle>
                  </DialogHeader>
                  <TaskForm
                    projects={projects}
                    users={users}
                    tasks={tasks}
                    initialStatus={column.id}
                    onSuccess={() => {
                      setIsFormOpen(false);
                      setSelectedColumnStatus("");
                      onTaskUpdate();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        );
      })}

      {/* Dialog para editar tarefa */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            projects={projects}
            users={users}
            tasks={tasks}
            onSuccess={() => {
              setIsEditFormOpen(false);
              setEditingTask(null);
              onTaskUpdate();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
