import React, { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Clock, Plus, Edit2, Trash2, MoreVertical, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TaskForm from "./task-form";
import type { Task, Project, User, TaskStatus } from "@shared/schema";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  taskStatuses: TaskStatus[];
  onTaskUpdate: () => void; // Callback to refetch tasks
}

interface SortableTaskItemProps {
  task: Task;
  projects: Project[];
  users: User[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  isOverdue: (dueDate: string | null) => boolean;
  getPriorityColor: (priority: string) => string;
  getPriorityText: (priority: string) => string;
  getProjectName: (projectId: number | null) => string;
  getUserName: (userId: number | null) => string;
  isDragging?: boolean; // Optional: for styling the drag overlay
}

// Individual Sortable Task Card
function SortableTaskItem({ 
  task, projects, users, onEdit, onDelete, isOverdue, 
  getPriorityColor, getPriorityText, getProjectName, getUserName, isDragging 
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
    opacity: isCurrentlyDragging ? 0.5 : 1,
    zIndex: isCurrentlyDragging ? 100 : 'auto',
    borderLeft: `4px solid ${task.status?.color || '#ccc'}`,
    boxShadow: isDragging || isCurrentlyDragging ? '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' : undefined,
  };
  
  const taskStatusColor = task.status?.color || '#ccc';


  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab hover:shadow-lg transition-shadow bg-white mb-3 ${isDragging ? 'opacity-75 shadow-2xl' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
            <div className="flex items-center space-x-1">
              <Badge className={`${getPriorityColor(task.priority)} px-1.5 py-0.5 text-xs`}>
                {getPriorityText(task.priority)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit2 className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a tarefa "{task.title}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(task.id)} className="bg-red-600 hover:bg-red-700">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {task.description && <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>}
          <div className="space-y-1 text-xs text-gray-500">
            <div>📁 {getProjectName(task.projectId)}</div>
            <div>👤 {getUserName(task.assignedTo)}</div>
            {task.dueDate && (
              <div className={`flex items-center space-x-1 ${isOverdue(task.dueDate) ? 'text-red-500 font-medium' : ''}`}>
                <Clock className="w-3 h-3" />
                <span>
                  {format(new Date(task.dueDate), "dd/MM/yy", { locale: ptBR })}
                  {isOverdue(task.dueDate) && " (Vencida)"}
                </span>
              </div>
            )}
          </div>
          {task.parentTaskId && <Badge variant="outline" className="text-xs py-0.5 px-1.5">Subtarefa</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}


export default function KanbanBoard({ tasks: initialTasks, projects, users, taskStatuses, onTaskUpdate }: KanbanBoardProps) {
  const { toast } = useToast();
  const [activeTask, setActiveTask] = useState<Task | null>(null); // For DragOverlay
  const [tasks, setTasks] = useState<Task[]>(initialTasks); // Local state for optimistic updates

  const [isNewTaskFormOpen, setIsNewTaskFormOpen] = useState(false);
  const [selectedTaskStatusForNewTask, setSelectedTaskStatusForNewTask] = useState<number | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);


  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, taskStatusId }: { taskId: number; taskStatusId: number }) => {
      return apiRequest("PUT", `/api/tasks/${taskId}`, { taskStatusId });
    },
    onSuccess: () => {
      // No toast here, optimistic update already happened. Refetch to confirm.
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: Error, variables) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar a tarefa. Revertendo.",
        variant: "destructive",
      });
      // Revert optimistic update
      setTasks(initialTasks); 
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => apiRequest("DELETE", `/api/tasks/${taskId}`),
    onSuccess: () => {
      toast({ title: "Tarefa excluída", description: "A tarefa foi excluída com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); // This will trigger a refetch and update initialTasks
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message || "Não foi possível excluir a tarefa.", variant: "destructive" });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // Drag after 8px movement
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id); // Task being dragged over
    const overContainerId = over.data.current?.sortable?.containerId; // Status ID of the column being dragged over
  
    if (!activeTask) return;

    // If dragging over a column (and not another task in the same column) or over a task in a different column
    if (overContainerId && activeTask.taskStatusId !== overContainerId) {
      setTasks((prevTasks) => {
        const activeIndex = prevTasks.findIndex(t => t.id === active.id);
        if (activeIndex === -1) return prevTasks;
        
        // Create a new array with the task moved to the new status (visually)
        // This part is tricky without knowing the target index in the new column.
        // For now, just update its status. The actual list update happens onDragEnd.
        const updatedTask = { ...prevTasks[activeIndex], taskStatusId: overContainerId };
        const newTasks = [...prevTasks];
        newTasks[activeIndex] = updatedTask; 
        return newTasks;
      });
    }
    // If dragging over another task within the same column for reordering
    else if (overTask && activeTask.taskStatusId === overTask.taskStatusId) {
        setTasks((prevTasks) => {
            const oldIndex = prevTasks.findIndex(t => t.id === active.id);
            const newIndex = prevTasks.findIndex(t => t.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return prevTasks;
            return arrayMove(prevTasks, oldIndex, newIndex);
        });
    }
  };
  

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.id !== over.id) {
      const oldTask = tasks.find(t => t.id === active.id);
      // over.id could be a column (status ID) or another task ID
      const newStatusId = typeof over.id === 'string' && over.id.startsWith('status-') 
        ? parseInt(over.id.replace('status-', ''), 10) 
        : tasks.find(t => t.id === over.id)?.taskStatusId;

      if (oldTask && newStatusId !== undefined && oldTask.taskStatusId !== newStatusId) {
        // Optimistic update of local state
        setTasks((prevTasks) => 
          prevTasks.map(t => 
            t.id === active.id ? { ...t, taskStatusId: newStatusId } : t
          )
        );
        updateTaskMutation.mutate({ taskId: active.id as number, taskStatusId: newStatusId });
      }
      // If reordering within the same column (backend for this part is not implemented)
      else if (oldTask && newStatusId !== undefined && oldTask.taskStatusId === newStatusId) {
        const oldIndex = tasks.findIndex(t => t.id === active.id);
        const newIndex = tasks.findIndex(t => t.id === over.id); // over.id is the task ID it was dropped on
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
             setTasks((currentTasks) => arrayMove(currentTasks, oldIndex, newIndex));
            // TODO: If backend supports task ordering within a status, call mutation here.
            // For now, this is a visual-only reorder within the column.
            toast({ title: "Reordenado (Visual)", description: "A ordem das tarefas nesta coluna foi alterada visualmente. O backend não salva esta ordem específica ainda."});
        }
      }
    }
  };
  
  const getPriorityColor = (priority: string) => { /* ... same as before ... */ 
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  const getPriorityText = (priority: string) => { /* ... same as before ... */ 
    switch (priority) {
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
      default: return priority;
    }
  };
  const getProjectName = (projectId: number | null) => { /* ... same as before ... */ 
    if (!projectId) return "Sem projeto";
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Projeto não encontrado";
  };
  const getUserName = (userId: number | null) => { /* ... same as before ... */ 
    if (!userId) return "Não atribuído";
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Usuário não encontrado";
  };
  const isOverdue = (dueDate: string | null): boolean => { /* ... same as before ... */ 
    if (!dueDate) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    return new Date(dueDate) < today;
  };

  const sortedStatuses = useMemo(() => [...taskStatuses].sort((a, b) => a.order - b.order), [taskStatuses]);
  
  const tasksByStatus = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    sortedStatuses.forEach(status => {
      grouped[`status-${status.id}`] = tasks.filter(task => task.taskStatusId === status.id);
    });
    // Group tasks with null statusId if needed, or filter them out
    // grouped['status-null'] = tasks.filter(task => task.taskStatusId === null);
    return grouped;
  }, [tasks, sortedStatuses]);


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className={`grid grid-cols-1 md:grid-cols-${sortedStatuses.length > 0 ? Math.min(sortedStatuses.length, 4) : 1} gap-6`}>
        {sortedStatuses.length === 0 && (
          <div className="md:col-span-3 text-center py-10">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum status de tarefa configurado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure status (colunas) para o seu quadro Kanban nas configurações de tarefas.
            </p>
          </div>
        )}

        {sortedStatuses.map((statusColumn) => {
          const columnTasks = tasksByStatus[`status-${statusColumn.id}`] || [];
          const columnTaskIds = columnTasks.map(t => t.id);

          return (
            <SortableContext key={`status-${statusColumn.id}`} items={columnTaskIds} strategy={verticalListSortingStrategy} id={`status-${statusColumn.id}`}>
              <Card className="h-fit flex flex-col">
                <CardHeader className="pb-3 sticky top-0 z-10" style={{ backgroundColor: statusColumn.color || '#e5e7eb' }}>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center space-x-2">
                      <span style={{ color: statusColumn.color && new Date(parseInt(statusColumn.color.substring(1,3),16)*0.299 + parseInt(statusColumn.color.substring(3,5),16)*0.587 + parseInt(statusColumn.color.substring(5,7),16)*0.114 > 186 ? '#000000' : '#ffffff' }}>
                        {statusColumn.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-white text-gray-700">{columnTasks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 min-h-[400px] space-y-0.5 bg-gray-50 flex-grow"> {/* Removed space-y-3 from here */}
                  {columnTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      projects={projects}
                      users={users}
                      onEdit={() => { setEditingTask(task); setIsEditFormOpen(true); }}
                      onDelete={deleteTaskMutation.mutate}
                      isOverdue={isOverdue}
                      getPriorityColor={getPriorityColor}
                      getPriorityText={getPriorityText}
                      getProjectName={getProjectName}
                      getUserName={getUserName}
                    />
                  ))}
                  <Dialog open={isNewTaskFormOpen && selectedTaskStatusForNewTask === statusColumn.id} onOpenChange={(open) => { /* ... */ }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700 mt-2"
                        onClick={() => { setSelectedTaskStatusForNewTask(statusColumn.id); setIsNewTaskFormOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Tarefa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle>Nova Tarefa - {statusColumn.name}</DialogTitle></DialogHeader>
                      <TaskForm projects={projects} users={users} tasks={tasks} taskStatuses={taskStatuses} initialTaskStatusId={statusColumn.id}
                        onSuccess={() => { setIsNewTaskFormOpen(false); setSelectedTaskStatusForNewTask(undefined); onTaskUpdate(); }} />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </SortableContext>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <SortableTaskItem 
            task={activeTask} 
            projects={projects} 
            users={users} 
            onEdit={() => {}} 
            onDelete={() => {}}
            isOverdue={isOverdue}
            getPriorityColor={getPriorityColor}
            getPriorityText={getPriorityText}
            getProjectName={getProjectName}
            getUserName={getUserName}
            isDragging={true} // Indicate that this is the drag overlay version
          />
        ) : null}
      </DragOverlay>
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Tarefa</DialogTitle></DialogHeader>
          <TaskForm task={editingTask} projects={projects} users={users} tasks={tasks} taskStatuses={taskStatuses}
            onSuccess={() => { setIsEditFormOpen(false); setEditingTask(null); onTaskUpdate(); }} />
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
