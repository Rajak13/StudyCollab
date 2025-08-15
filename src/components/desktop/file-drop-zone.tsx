'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useElectronDragDrop } from '@/hooks/use-electron-drag-drop';
import { FileText, Image, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

interface DroppedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
}

interface FileUploadProgress {
  file: DroppedFile;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileDropZoneProps {
  onFilesProcessed?: (files: DroppedFile[]) => void;
  acceptedExtensions?: string[];
  maxFileSize?: number; // in MB
  className?: string;
  showPreview?: boolean;
}

export function FileDropZone({
  onFilesProcessed,
  acceptedExtensions = ['.scnote', '.sctask', '.scboard', '.txt', '.md', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'],
  maxFileSize = 50, // 50MB default
  className = '',
  showPreview = true
}: FileDropZoneProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Process dropped files
  const processFiles = useCallback(async (files: DroppedFile[]) => {
    console.log('Processing dropped files:', files);

    // Filter files by size and extension
    const validFiles = files.filter(file => {
      const sizeInMB = file.size / (1024 * 1024);
      const isValidExtension = acceptedExtensions.includes(`.${file.extension}`);
      const isValidSize = sizeInMB <= maxFileSize;

      if (!isValidExtension) {
        toast({
          title: 'Invalid File Type',
          description: `${file.name} - File type .${file.extension} is not supported`,
          variant: 'destructive'
        });
        return false;
      }

      if (!isValidSize) {
        toast({
          title: 'File Too Large',
          description: `${file.name} - File size exceeds ${maxFileSize}MB limit`,
          variant: 'destructive'
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    // Initialize upload progress
    const initialProgress = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    setUploadProgress(initialProgress);

    // Process each file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        await processIndividualFile(file, i);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } : item
        ));
      }
    }

    // Call callback with processed files
    onFilesProcessed?.(validFiles);

    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);
  }, [acceptedExtensions, maxFileSize, toast, onFilesProcessed]);

  // Process individual file
  const processIndividualFile = useCallback(async (file: DroppedFile, index: number) => {
    // Simulate file processing with progress updates
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(prev => prev.map((item, i) => 
        i === index ? { ...item, progress } : item
      ));
    }

    // Handle different file types
    switch (file.extension) {
      case 'scnote':
        toast({
          title: 'StudyCollab Note Imported',
          description: `${file.name} has been imported`
        });
        router.push('/notes');
        break;

      case 'sctask':
        toast({
          title: 'StudyCollab Task Imported',
          description: `${file.name} has been imported`
        });
        router.push('/tasks');
        break;

      case 'scboard':
        toast({
          title: 'StudyCollab Board Imported',
          description: `${file.name} has been imported`
        });
        router.push('/study-groups');
        break;

      case 'txt':
      case 'md':
        toast({
          title: 'Text File Imported',
          description: `${file.name} has been converted to a note`
        });
        router.push('/notes/create');
        break;

      case 'pdf':
      case 'doc':
      case 'docx':
        toast({
          title: 'Document Added',
          description: `${file.name} has been added to your files`
        });
        router.push('/files');
        break;

      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        toast({
          title: 'Image Added',
          description: `${file.name} has been added to your files`
        });
        router.push('/files');
        break;

      default:
        toast({
          title: 'File Processed',
          description: `${file.name} has been processed`
        });
    }

    // Mark as completed
    setUploadProgress(prev => prev.map((item, i) => 
      i === index ? { ...item, status: 'completed' } : item
    ));
  }, [toast, router]);

  // Handle file open from system
  const handleFileOpen = useCallback((data: { type: string; path: string }) => {
    console.log('File opened via system:', data);
    
    toast({
      title: 'File Opened',
      description: `Opening ${data.type} file from system`
    });

    // Navigate to appropriate section
    switch (data.type) {
      case 'note':
        router.push('/notes');
        break;
      case 'task':
        router.push('/tasks');
        break;
      case 'board':
        router.push('/study-groups');
        break;
      default:
        router.push('/dashboard');
    }
  }, [toast, router]);

  // Handle protocol URLs
  const handleProtocolUrl = useCallback((url: string) => {
    console.log('Protocol URL received:', url);
    
    const parts = url.split('/');
    const action = parts[0];
    
    switch (action) {
      case 'note':
        router.push(parts[1] ? `/notes/${parts[1]}` : '/notes');
        break;
      case 'task':
        router.push(parts[1] ? `/tasks?id=${parts[1]}` : '/tasks');
        break;
      case 'group':
        router.push(parts[1] ? `/study-groups/${parts[1]}` : '/study-groups');
        break;
      default:
        router.push('/dashboard');
    }
  }, [router]);

  // Handle file import trigger
  const handleImportFile = useCallback((data: { path: string }) => {
    console.log('File import triggered:', data);
    router.push('/files');
  }, [router]);

  // Set up drag and drop
  useElectronDragDrop({
    onFilesDropped: processFiles,
    onFileOpen: handleFileOpen,
    onProtocolUrl: handleProtocolUrl,
    onImportFile: handleImportFile,
    acceptedExtensions
  });

  // Get file icon
  const getFileIcon = useCallback((extension: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'md'];
    
    if (imageExtensions.includes(extension)) {
      return <Image className="h-4 w-4" />;
    } else if (documentExtensions.includes(extension)) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <Upload className="h-4 w-4" />;
    }
  }, []);

  // Remove file from upload progress
  const removeFile = useCallback((index: number) => {
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone indicator */}
      {isDragOver && (
        <Card className="border-2 border-dashed border-primary bg-primary/5">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Drop files here</h3>
              <p className="text-muted-foreground">
                Supported formats: {acceptedExtensions.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload progress */}
      {showPreview && uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Processing Files</h4>
            <div className="space-y-3">
              {uploadProgress.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(item.file.extension)}
                      <span className="text-sm font-medium">{item.file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'completed' && (
                        <span className="text-xs text-green-600">✓ Complete</span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-xs text-red-600">✗ Error</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {item.status === 'uploading' && (
                    <Progress value={item.progress} className="h-2" />
                  )}
                  {item.status === 'error' && item.error && (
                    <p className="text-xs text-red-600">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-2">Drag and Drop Files</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Drop files anywhere in the application to import them
          </p>
          <div className="text-xs text-muted-foreground">
            <p>Supported formats:</p>
            <p className="mt-1">
              StudyCollab files (.scnote, .sctask, .scboard)<br />
              Documents (.txt, .md, .pdf, .doc, .docx)<br />
              Images (.jpg, .jpeg, .png, .gif)
            </p>
            <p className="mt-2">Maximum file size: {maxFileSize}MB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for using file drop functionality
export const useFileDropZone = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const processDroppedFiles = useCallback(async (files: DroppedFile[]) => {
    console.log('Processing dropped files:', files);
    
    for (const file of files) {
      toast({
        title: 'File Dropped',
        description: `Processing ${file.name}...`
      });
    }
  }, [toast]);

  return {
    isDragOver,
    setIsDragOver,
    processDroppedFiles
  };
};