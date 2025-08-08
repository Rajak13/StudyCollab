import { useCallback, useEffect, useRef } from 'react';

interface DroppedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
}

interface UseElectronDragDropOptions {
  onFilesDropped?: (files: DroppedFile[]) => void;
  onFileOpen?: (file: { type: string; path: string }) => void;
  onProtocolUrl?: (url: string) => void;
  onImportFile?: (file: { path: string }) => void;
  acceptedExtensions?: string[];
}

export function useElectronDragDrop(options: UseElectronDragDropOptions = {}) {
  const {
    onFilesDropped,
    onFileOpen,
    onProtocolUrl,
    onImportFile,
    acceptedExtensions = ['.scnote', '.sctask', '.scboard', '.txt', '.md', '.pdf', '.doc', '.docx']
  } = options;

  const dragCounterRef = useRef(0);

  // Handle drag and drop events
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    
    // Add visual feedback
    document.body.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      document.body.classList.remove('drag-over');
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current = 0;
    document.body.classList.remove('drag-over');

    if (!e.dataTransfer?.files) return;

    const files = Array.from(e.dataTransfer.files);
    const filePaths = files.map(file => (file as any).path || file.name);
    
    // Filter files by accepted extensions
    const acceptedFiles = filePaths.filter(path => {
      const extension = '.' + path.split('.').pop()?.toLowerCase();
      return acceptedExtensions.includes(extension);
    });

    if (acceptedFiles.length === 0) {
      console.warn('No accepted files found in drop');
      return;
    }

    try {
      // Use Electron API to get file metadata if available
      if (window.electronAPI?.getDroppedFiles) {
        const fileMetadata = await window.electronAPI.getDroppedFiles(acceptedFiles);
        onFilesDropped?.(fileMetadata);
      } else {
        // Fallback for web version
        const fileMetadata = acceptedFiles.map(path => ({
          path,
          name: path.split(/[\\/]/).pop() || '',
          extension: path.split('.').pop()?.toLowerCase() || '',
          size: 0
        }));
        onFilesDropped?.(fileMetadata);
      }
    } catch (error) {
      console.error('Error processing dropped files:', error);
    }
  }, [acceptedExtensions, onFilesDropped]);

  // Handle Electron-specific events
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleFileOpen = (event: any, data: { type: string; path: string }) => {
      onFileOpen?.(data);
    };

    const handleProtocolUrl = (event: any, url: string) => {
      onProtocolUrl?.(url);
    };

    const handleImportFile = (event: any, data: { path: string }) => {
      onImportFile?.(data);
    };

    // Listen for Electron events
    window.electronAPI.on('open-file', handleFileOpen);
    window.electronAPI.on('protocol-url', handleProtocolUrl);
    window.electronAPI.on('import-file', handleImportFile);

    return () => {
      window.electronAPI?.off('open-file', handleFileOpen);
      window.electronAPI?.off('protocol-url', handleProtocolUrl);
      window.electronAPI?.off('import-file', handleImportFile);
    };
  }, [onFileOpen, onProtocolUrl, onImportFile]);

  // Set up drag and drop event listeners
  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  // Utility functions
  const showSystemNotification = useCallback((options: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
    urgency?: 'normal' | 'critical' | 'low';
    actions?: Array<{ type: string; text: string }>;
    tag?: string;
  }) => {
    if (window.electronAPI?.showSystemNotification) {
      window.electronAPI.showSystemNotification(options);
    } else {
      // Fallback to web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          silent: options.silent,
          tag: options.tag
        });
      }
    }
  }, []);

  const showReminderNotification = useCallback((title: string, body: string, reminderData?: any) => {
    if (window.electronAPI?.showReminderNotification) {
      window.electronAPI.showReminderNotification(title, body, reminderData);
    } else {
      showSystemNotification({ title: `📚 ${title}`, body });
    }
  }, [showSystemNotification]);

  const showGroupActivityNotification = useCallback((groupName: string, activity: string, userName?: string) => {
    if (window.electronAPI?.showGroupActivityNotification) {
      window.electronAPI.showGroupActivityNotification(groupName, activity, userName);
    } else {
      const title = `👥 ${groupName}`;
      const body = userName ? `${userName} ${activity}` : activity;
      showSystemNotification({ title, body });
    }
  }, [showSystemNotification]);

  return {
    showSystemNotification,
    showReminderNotification,
    showGroupActivityNotification,
    isElectron: !!window.electronAPI
  };
}

// Global type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      getDroppedFiles: (files: string[]) => Promise<any[]>;
      showSystemNotification: (options: any) => void;
      showReminderNotification: (title: string, body: string, reminderData?: any) => void;
      showGroupActivityNotification: (groupName: string, activity: string, userName?: string) => void;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      off: (channel: string, callback: (...args: any[]) => void) => void;
      registerGlobalShortcut: (accelerator: string, action: string, description: string) => Promise<boolean>;
      unregisterGlobalShortcut: (accelerator: string) => void;
      getRegisteredShortcuts: () => Promise<any[]>;
    };
    isElectron?: boolean;
  }
}