import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Download, Trash2, FileText, Image, FileArchive, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ProjectFile } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth'; // To check user role for UI hints

interface ProjectFileListProps {
  projectId: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType: string): JSX.Element {
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText className="h-5 w-5 text-green-500" />;
  if (fileType.includes('word')) return <FileText className="h-5 w-5 text-blue-700" />;
  if (fileType.includes('dwg') || fileType.includes('dxf')) return <FileArchive className="h-5 w-5 text-purple-500" />; // Placeholder for CAD
  return <FileText className="h-5 w-5 text-gray-500" />;
}

export default function ProjectFileList({ projectId }: ProjectFileListProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user for role checks (UI hints)

  const { data: files = [], isLoading, isError, error } = useQuery<ProjectFile[]>({
    queryKey: [`/api/projects/${projectId}/files`],
    // queryFn will be handled by the default queryClient setup
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      return apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Arquivo excluído',
        description: 'O arquivo foi excluído com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro ao excluir',
        description: err.message || 'Não foi possível excluir o arquivo.',
        variant: 'destructive',
      });
    },
  });

  const handleDownload = async (fileId: number, originalName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/${fileId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Download failed' }));
        throw new Error(errorData.message || `Download failed: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: 'Download iniciado', description: `Baixando ${originalName}` });
    } catch (err: any) {
      toast({
        title: 'Erro no Download',
        description: err.message || 'Não foi possível baixar o arquivo.',
        variant: 'destructive',
      });
    }
  };
  
  // Determine if delete button should be visible based on role (UI hint, backend enforces)
  const canDeleteFiles = user?.role === 'admin' || user?.role === 'architect';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <p className="ml-2 text-muted-foreground">Carregando arquivos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-red-600">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Erro ao carregar arquivos: {error?.message || 'Erro desconhecido'}</p>
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Arquivos do Projeto</CardTitle>
        <CardDescription>Lista de arquivos anexados a este projeto.</CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum arquivo encontrado para este projeto.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data de Upload</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{getFileIcon(file.fileType)}</TableCell>
                  <TableCell className="font-medium">{file.originalName}</TableCell>
                  <TableCell>{formatFileSize(file.fileSize || 0)}</TableCell>
                  <TableCell>{format(new Date(file.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file.id, file.originalName)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>
                    {canDeleteFiles && (
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deleteMutation.isPending && deleteMutation.variables === file.id}>
                            {deleteMutation.isPending && deleteMutation.variables === file.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o arquivo "{file.originalName}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(file.id)} className="bg-red-600 hover:bg-red-700">
                              Confirmar Exclusão
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
