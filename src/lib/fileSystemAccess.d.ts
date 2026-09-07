// Minimal ambient types for the parts of the File System Access API that
// TypeScript's bundled DOM lib doesn't (yet) declare. Feature-detected at
// runtime in autoBackup.ts — this file only exists so the code compiles.
export {};

declare global {
  type FSPermissionMode = 'read' | 'readwrite';
  type FSPermissionState = 'granted' | 'denied' | 'prompt';

  interface FileSystemDirectoryHandle {
    requestPermission(descriptor?: { mode?: FSPermissionMode }): Promise<FSPermissionState>;
    queryPermission(descriptor?: { mode?: FSPermissionMode }): Promise<FSPermissionState>;
    values(): AsyncIterableIterator<FileSystemHandle>;
  }

  interface Window {
    showDirectoryPicker?: (options?: { id?: string; mode?: FSPermissionMode; startIn?: string }) => Promise<FileSystemDirectoryHandle>;
  }
}
