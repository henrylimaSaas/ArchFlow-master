import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Clock, AlertTriangle, CheckCircle, Plus, Edit2, Trash2, MoreVertical, Palette, KeySquare, Columns } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TaskForm from "./task-form";
import type { Task, Project, User, TaskStatus, InsertTaskStatus } from "@shared/schema";

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  onTaskUpdate: () => void;
}

const defaultColumns = [
  { id: "todo", title: "A Fazer", color: "bg-gray-100", icon: Clock, isCustom: false },
  { id: "in_progress", title: "Em Andamento", color: "bg-blue-100", icon: AlertTriangle, isCustom: false },
  { id: "done", title: "Concluído", color: "bg-green-100", icon: CheckCircle, isCustom: false },
];

interface Column {
  id: string;
  title: string;
  color: string;
  icon: React.ElementType;
  isCustom: boolean;
}

export default function KanbanBoard({ tasks, projects, users, onTaskUpdate }: KanbanBoardProps) {
  const { toast } = useToast();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedColumnStatus, setSelectedColumnStatus] = useState<string>("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditTaskFormOpen, setIsEditTaskFormOpen] = useState(false);
  const [isAddStatusDialogOpen, setIsAddStatusDialogOpen] = useState(false);
  const [allColumns, setAllColumns] = useState<Column[]>(defaultColumns);

  const { data: customStatuses = [] } = useQuery<TaskStatus[]>({
    queryKey: ["/api/task-status"],
    queryFn: async () => {
      // Adapting to use apiRequest if possible, otherwise direct fetch
      // For now, using direct fetch as per issue description
      const token = localStorage.getItem('token');
      const response = await fetch("/api/task-status", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch task statuses');
      }
      return response.json();
    },
  });

  useEffect(() => {
    const mappedCustomColumns: Column[] = customStatuses.map(status => ({
      id: status.key,
      title: status.name,
      color: status.color || 'bg-gray-200', // Default color if not specified
      icon: Columns, // Generic icon for custom statuses
      isCustom: true,
    }));
    // Simple merge: default first, then custom. Could be more sophisticated.
    setAllColumns([...defaultColumns, ...mappedCustomColumns]);
  }, [customStatuses]);


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

  const createStatusMutation = useMutation({
    mutationFn: async (newStatusData: InsertTaskStatus) => {
      return apiRequest("POST", "/api/task-status", newStatusData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/task-status"] });
      toast({
        title: "Status criado",
        description: "O novo status foi adicionado com sucesso.",
      });
      setIsAddStatusDialogOpen(false); // Close the dialog form here
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar status",
        description: error.message || "Não foi possível criar o novo status.",
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

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_") // Replace spaces with _
      .replace(/[^\w-]+/g, "") // Remove all non-word chars
      .replace(/--+/g, "-"); // Replace multiple - with single -
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
  
  const handleAddStatusSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const key = formData.get("key") as string || slugify(name); // Auto-generate key if empty
    const color = formData.get("color") as string;

    if (!name || !key) {
      toast({ title: "Erro", description: "Nome e Chave são obrigatórios.", variant: "destructive" });
      return;
    }
    
    // Assuming officeId is available, e.g., from user context or props if needed by InsertTaskStatus
    // For now, InsertTaskStatus in schema doesn't strictly require officeId on client if backend handles it
    createStatusMutation.mutate({ name, key, color });
  };


  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={isAddStatusDialogOpen} onOpenChange={setIsAddStatusDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Novo Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Status da Tarefa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStatusSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="status-name">Nome do Status</Label>
                  <Input id="status-name" name="name" placeholder="Ex: Em Revisão" required />
                </div>
                <div>
                  <Label htmlFor="status-key">Chave do Status</Label>
                  <Input id="status-key" name="key" placeholder="Ex: em_revisao (auto-gerado se vazio)" />
                  <p className="text-xs text-gray-500 mt-1">Use letras minúsculas e underscores. Será auto-gerado a partir do nome se deixado em branco.</p>
                </div>
                <div>
                  <Label htmlFor="status-color">Cor</Label>
                  <Input id="status-color" name="color" placeholder="Ex: bg-yellow-200 ou #FFFF00" />
                   <p className="text-xs text-gray-500 mt-1">Use classes Tailwind (ex: bg-blue-500) ou um código hexadecimal.</p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={createStatusMutation.isPending}>
                  {createStatusMutation.isPending ? "Salvando..." : "Salvar Status"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-${allColumns.length > 3 ? allColumns.length : 3} gap-6`}>
        {allColumns.map((column) => {
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
                                      setIsEditTaskFormOpen(true);
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
                
                <Dialog open={isTaskFormOpen && selectedColumnStatus === column.id} onOpenChange={(open) => {
                  if (!open) {
                    setIsTaskFormOpen(false);
                    setSelectedColumnStatus("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400"
                      onClick={() => {
                        setSelectedColumnStatus(column.id);
                        setIsTaskFormOpen(true);
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
                        setIsTaskFormOpen(false);
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
        <Dialog open={isEditTaskFormOpen} onOpenChange={setIsEditTaskFormOpen}>
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
                setIsEditTaskFormOpen(false);
                setEditingTask(null);
                onTaskUpdate();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
