import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import type { Task, Project, User } from "@shared/schema";

const taskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  // status: z.enum(["todo", "in_progress", "completed"]), // Replaced by taskStatusId
  taskStatusId: z.number().int().positive().optional().nullable(), // Added taskStatusId
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  projectId: z.number().optional(),
  assignedTo: z.number().optional(),
  parentTaskId: z.number().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task | null;
  projects: Project[];
  users: User[];
  tasks: Task[]; // For parent task selection
  taskStatuses: TaskStatus[]; // New prop for custom statuses
  initialTaskStatusId?: number; // New prop for pre-selecting a status
  onSuccess: () => void;
}

export default function TaskForm({ task, projects, users, tasks, taskStatuses, initialTaskStatusId, onSuccess }: TaskFormProps) {
  const { toast } = useToast();
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      taskStatusId: task?.taskStatusId || initialTaskStatusId || (taskStatuses.length > 0 ? taskStatuses[0].id : undefined),
      priority: task?.priority || "medium",
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      projectId: task?.projectId || undefined,
      assignedTo: task?.assignedTo || undefined,
      parentTaskId: task?.parentTaskId || undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      // const token = authService.getToken(); // apiRequest handles token
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        taskStatusId: data.taskStatusId || (taskStatuses.length > 0 ? taskStatuses[0].id : null), // Ensure a status ID is sent
      };
      return apiRequest("POST", "/api/tasks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); // This refetches tasks
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a tarefa.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      // const token = authService.getToken(); // apiRequest handles token
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      return apiRequest("PUT", `/api/tasks/${task!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); // This refetches tasks
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a tarefa.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    const dataToSubmit: Partial<TaskFormData> = { ...data };
    // Ensure taskStatusId is set if it's undefined and there are statuses
    if (dataToSubmit.taskStatusId === undefined && taskStatuses.length > 0) {
      dataToSubmit.taskStatusId = taskStatuses.sort((a,b) => a.order - b.order)[0].id;
    }


    if (task) {
      updateMutation.mutate(dataToSubmit as TaskFormData); // Cast as TaskFormData, though it might be partial for update
    } else {
      createMutation.mutate(dataToSubmit as TaskFormData); // For create, it should be full
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Filter parent tasks (exclude current task and its children)
  const availableParentTasks = tasks.filter(t => 
    t.id !== task?.id && 
    // t.parentTaskId !== task?.id && // This condition might be too restrictive or incorrect for deep hierarchies
    !t.parentTaskId // Simplified: Only allow top-level tasks to be parents for now
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input placeholder="Digite o título da tarefa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva os detalhes da tarefa..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="taskStatusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                  value={field.value?.toString()}
                  defaultValue={field.value?.toString() || (taskStatuses.length > 0 ? taskStatuses.sort((a,b) => a.order - b.order)[0].id.toString() : undefined)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taskStatuses.sort((a,b) => a.order - b.order).map(status => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Vencimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projeto</FormLabel>
              <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável</FormLabel>
              <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentTaskId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarefa Pai (Sub-tarefa)</FormLabel>
              <Select onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma tarefa pai (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (Tarefa principal)</SelectItem>
                  {availableParentTasks.map((parentTask) => (
                    <SelectItem key={parentTask.id} value={parentTask.id.toString()}>
                      {parentTask.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Salvando..." : task ? "Atualizar" : "Criar Tarefa"}
          </Button>
        </div>
      </form>
    </Form>
  );
}