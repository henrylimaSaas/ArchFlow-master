import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Edit, Trash2, Palette, Check, X, Loader2, GripVertical } from 'lucide-react';
import type { TaskStatus, InsertTaskStatus } from '@shared/schema'; // Assuming these types exist

// Zod schema for form validation (client-side)
// Ensure this aligns with `insertTaskStatusSchema` from shared/schema.ts, especially `name`
const taskStatusFormSchema = z.object({
  name: z.string().min(1, "O nome do status é obrigatório."),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Cor inválida (ex: #RRGGBB ou #RGB).").optional().or(z.literal('')), // Optional, allow empty string for default
  order: z.coerce.number().int().min(0, "Ordem deve ser um número positivo.").optional(),
});
type TaskStatusFormData = z.infer<typeof taskStatusFormSchema>;

interface TaskStatusManagerProps {
  // Props if needed, like officeId if not directly available via auth context
}

export default function TaskStatusManager({}: TaskStatusManagerProps) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null);

  const { data: statuses = [], isLoading: isLoadingStatuses, refetch: refetchStatuses } = useQuery<TaskStatus[]>({
    queryKey: ['/api/task_statuses'],
    // queryFn handled by default queryClient
  });

  const form = useForm<TaskStatusFormData>({
    resolver: zodResolver(taskStatusFormSchema),
    defaultValues: { name: '', color: '', order: 0 },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTaskStatus) => apiRequest('POST', '/api/task_statuses', data),
    onSuccess: () => {
      toast({ title: 'Status criado', description: 'Novo status de tarefa criado com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['/api/task_statuses'] });
      setIsFormOpen(false);
      form.reset({ name: '', color: '', order: (statuses.length > 0 ? Math.max(...statuses.map(s => s.order)) + 1 : 0) });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertTaskStatus> }) =>
      apiRequest('PUT', `/api/task_statuses/${id}`, data),
    onSuccess: () => {
      toast({ title: 'Status atualizado', description: 'Status da tarefa atualizado com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['/api/task_statuses'] });
      setIsFormOpen(false);
      setEditingStatus(null);
      form.reset({ name: '', color: '', order: 0 });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/task_statuses/${id}`),
    onSuccess: () => {
      toast({ title: 'Status excluído', description: 'Status da tarefa excluído com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['/api/task_statuses'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  const handleEdit = (status: TaskStatus) => {
    setEditingStatus(status);
    form.reset({
      name: status.name,
      color: status.color || '',
      order: status.order,
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingStatus(null);
    const nextOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.order)) + 1 : 0;
    form.reset({ name: '', color: '#cccccc', order: nextOrder }); // Default color and next order
    setIsFormOpen(true);
  };

  const onSubmit = (data: TaskStatusFormData) => {
    const payload: Partial<InsertTaskStatus> = {
      name: data.name,
      color: data.color || null, // Send null if empty for default DB color or handling
      order: data.order,
    };

    if (editingStatus) {
      updateMutation.mutate({ id: editingStatus.id, data: payload });
    } else {
      createMutation.mutate(payload as InsertTaskStatus); // Cast because all fields are present for create
    }
  };
  
  const defaultColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FED766", "#2AB7CA", "#F0B67F", "#8A6FDF", "#D6A2E8"];


  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Gerenciar Status das Tarefas</h2>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Status
        </Button>
      </div>

      {isLoadingStatuses && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="ml-2 text-muted-foreground">Carregando status...</p>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen);
          if (!isOpen) {
            form.reset();
            setEditingStatus(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatus ? 'Editar Status' : 'Adicionar Novo Status'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Status</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Backlog, Em Revisão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor (Hex)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="color" {...field} className="p-1 h-10 w-14" />
                        <Input placeholder="#RRGGBB" {...field} />
                      </div>
                    </FormControl>
                     <div className="flex flex-wrap gap-2 mt-2">
                        {defaultColors.map(c => (
                            <button type="button" key={c} onClick={() => form.setValue('color', c, {shouldValidate: true})} className="w-6 h-6 rounded-full border" style={{backgroundColor: c}}></button>
                        ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStatus ? 'Salvar Alterações' : 'Criar Status'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Status List */}
      <div className="space-y-3">
        {statuses.sort((a,b) => a.order - b.order).map((status) => (
          <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg shadow-sm bg-card">
            <div className="flex items-center gap-3">
              {/* <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" /> */}
              <div className="w-5 h-5 rounded-sm border" style={{ backgroundColor: status.color || '#ccc' }}></div>
              <span className="font-medium">{status.name} (Ordem: {status.order})</span>
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(status)}>
                <Edit className="mr-1 h-3 w-3" /> Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleteMutation.isPending && deleteMutation.variables === status.id}>
                    {deleteMutation.isPending && deleteMutation.variables === status.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                     Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o status "{status.name}"? As tarefas neste status não serão excluídas, mas ficarão sem status atribuído (ou poderão ser movidas para um status padrão, dependendo da lógica do backend - atualmente serão desassociadas).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(status.id)} className="bg-red-600 hover:bg-red-700">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
