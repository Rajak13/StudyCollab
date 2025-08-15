'use client';

import { useToast } from '@/components/ui/use-toast';
import { useElectronDragDrop } from '@/hooks/use-electron-drag-drop';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { DesktopNotifications } from '../desktop/desktop-notifications';

interface DroppedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
}

export function ElectronIntegration() {
  const router = useRouter();
  const { toast } = useToast();

  const handleFilesDropped = useCallback((files: DroppedFile[]) => {
    console.log('Files dropped:', files);
    
    files.forEach(file => {
      switch (file.extension) {
        case 'scnote':
          // Handle StudyCollab note file
          toast({
            title: 'Note File Opened',
            description: `Opening ${file.name}...`
          });
          // TODO: Implement note file import
          break;
          
        case 'sctask':
          // Handle StudyCollab task file
          toast({
            title: 'Task File Opened',
            description: `Opening ${file.name}...`
          });
          // TODO: Implement task file import
          break;
          
        case 'scboard':
          // Handle StudyCollab board file
          toast({
            title: 'Board File Opened',
            description: `Opening ${file.name}...`
          });
          // TODO: Implement board file import
          break;
          
        case 'txt':
        case 'md':
          // Handle text/markdown files
          toast({
            title: 'Text File Imported',
            description: `Importing ${file.name} as a note...`
          });
          // TODO: Import as note
          router.push('/notes/create');
          break;
          
        case 'pdf':
        case 'doc':
        case 'docx':
          // Handle document files
          toast({
            title: 'Document Imported',
            description: `Adding ${file.name} to files...`
          });
          // TODO: Import to file manager
          router.push('/files');
          break;
          
        default:
          toast({
            title: 'File Dropped',
            description: `${file.name} - File type not specifically handled`,
            variant: 'default'
          });
      }
    });
  }, [router, toast]);

  const handleFileOpen = useCallback((data: { type: string; path: string }) => {
    console.log('File opened via association:', data);
    
    switch (data.type) {
      case 'note':
        toast({
          title: 'Opening Note',
          description: 'Loading note from file association...'
        });
        router.push('/notes');
        break;
        
      case 'task':
        toast({
          title: 'Opening Task',
          description: 'Loading task from file association...'
        });
        router.push('/tasks');
        break;
        
      case 'board':
        toast({
          title: 'Opening Study Board',
          description: 'Loading study board from file association...'
        });
        router.push('/study-groups');
        break;
        
      default:
        toast({
          title: 'File Opened',
          description: `Opening ${data.type} file...`
        });
    }
  }, [router, toast]);

  const handleProtocolUrl = useCallback((url: string) => {
    console.log('Protocol URL received:', url);
    
    // Parse studycollab:// URLs
    const parts = url.split('/');
    const action = parts[0];
    
    switch (action) {
      case 'note':
        if (parts[1]) {
          router.push(`/notes/${parts[1]}`);
        } else {
          router.push('/notes');
        }
        break;
        
      case 'task':
        if (parts[1]) {
          router.push(`/tasks?id=${parts[1]}`);
        } else {
          router.push('/tasks');
        }
        break;
        
      case 'group':
        if (parts[1]) {
          router.push(`/study-groups/${parts[1]}`);
        } else {
          router.push('/study-groups');
        }
        break;
        
      case 'dashboard':
        router.push('/dashboard');
        break;
        
      default:
        toast({
          title: 'Protocol URL',
          description: `Received: studycollab://${url}`
        });
        router.push('/dashboard');
    }
  }, [router, toast]);

  const handleImportFile = useCallback((data: { path: string }) => {
    console.log('Import file triggered:', data);
    
    toast({
      title: 'File Import',
      description: 'Opening file import dialog...'
    });
    
    // Navigate to appropriate section for file import
    router.push('/files');
  }, [router, toast]);

  // Set up drag and drop handling
  const { showReminderNotification, showGroupActivityNotification } = useElectronDragDrop({
    onFilesDropped: handleFilesDropped,
    onFileOpen: handleFileOpen,
    onProtocolUrl: handleProtocolUrl,
    onImportFile: handleImportFile,
    acceptedExtensions: ['.scnote', '.sctask', '.scboard', '.txt', '.md', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif']
  });

  // Handle global shortcuts
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleGlobalShortcut = (event: any, action: string) => {
      console.log('Global shortcut triggered:', action);
      
      switch (action) {
        case 'new-note':
          router.push('/notes/create');
          break;
          
        case 'new-task':
          // TODO: Open task creation dialog
          router.push('/tasks');
          break;
          
        case 'quick-capture':
          // TODO: Open quick capture dialog
          toast({
            title: 'Quick Capture',
            description: 'Quick capture feature coming soon!'
          });
          break;
          
        case 'global-search':
          // TODO: Open global search
          toast({
            title: 'Global Search',
            description: 'Global search feature coming soon!'
          });
          break;
          
        case 'show-tasks':
          router.push('/tasks');
          break;
          
        default:
          console.warn('Unknown global shortcut action:', action);
      }
    };

    const handleNavigateTo = (event: any, path: string) => {
      router.push(path);
    };

    const handleShowShortcutsHelp = () => {
      toast({
        title: 'Keyboard Shortcuts',
        description: 'Check the settings page for available shortcuts'
      });
      router.push('/settings');
    };

    const handleTriggerFileImport = () => {
      handleImportFile({ path: '' });
    };

    // Listen for Electron events
    window.electronAPI?.on('global-shortcut', handleGlobalShortcut);
    window.electronAPI?.on('navigate-to', handleNavigateTo);
    window.electronAPI?.on('show-shortcuts-help', handleShowShortcutsHelp);
    window.electronAPI?.on('trigger-file-import', handleTriggerFileImport);

    return () => {
      window.electronAPI?.off('global-shortcut', handleGlobalShortcut);
      window.electronAPI?.off('navigate-to', handleNavigateTo);
      window.electronAPI?.off('show-shortcuts-help', handleShowShortcutsHelp);
      window.electronAPI?.off('trigger-file-import', handleTriggerFileImport);
    };
  }, [router, toast, handleImportFile]);

  // Expose notification functions globally for other components to use
  useEffect(() => {
    if (window.electronAPI) {
      (window as any).showReminderNotification = showReminderNotification;
      (window as any).showGroupActivityNotification = showGroupActivityNotification;
    }
  }, [showReminderNotification, showGroupActivityNotification]);

  // Add drag-over styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      body.drag-over {
        background-color: rgba(59, 130, 246, 0.1);
        transition: background-color 0.2s ease;
      }
      
      body.drag-over::after {
        content: "Drop files here to import";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(59, 130, 246, 0.9);
        color: white;
        padding: 20px 40px;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 600;
        z-index: 9999;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* Desktop notifications component */}
      <DesktopNotifications />
    </>
  );
}