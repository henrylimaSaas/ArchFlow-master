import { useState, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient'; // Assuming apiRequest can handle FormData
import { Loader2 } from 'lucide-react';

interface ProjectFileUploadProps {
  projectId: number;
}

export default function ProjectFileUpload({ projectId }: ProjectFileUploadProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // apiRequest needs to be adapted or a new function created for FormData
      // For now, let's assume a specific fetch call:
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          // 'Content-Type': 'multipart/form-data' is automatically set by browser with FormData
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed with no details' }));
        throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Upload bem-sucedido',
        description: 'O arquivo foi enviado com sucesso.',
      });
      setSelectedFile(null); // Reset file input
      // Invalidate queries to refresh file list for this project
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no Upload',
        description: error.message || 'Não foi possível enviar o arquivo.',
        variant: 'destructive',
      });
    },
  });

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    } else {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione um arquivo para enviar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Enviar Arquivo do Projeto</h3>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor={`file-upload-${projectId}`}>Selecione o arquivo</Label>
        <Input 
          id={`file-upload-${projectId}`} 
          type="file" 
          onChange={handleFileChange} 
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
      </div>
      {selectedFile && (
        <p className="text-sm text-muted-foreground">
          Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
        </p>
      )}
      <Button 
        onClick={handleUpload} 
        disabled={!selectedFile || uploadMutation.isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        {uploadMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar Arquivo'
        )}
      </Button>
    </div>
  );
}
