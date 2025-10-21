'use client';

import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from './dropdown-menu';
import { FolderPlus, Folder, Plus } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  description?: string;
  agents: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

interface FolderSelectorProps {
  folders: Folder[];
  onFolderCreate: (name: string, description?: string) => Promise<void>;
  onMoveToFolder: (folderId: string | null) => Promise<void>;
  currentFolderId?: string | null;
}

export function FolderSelector({ folders, onFolderCreate, onMoveToFolder, currentFolderId }: FolderSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Safety check to ensure folders is always an array
  const safeFolders = Array.isArray(folders) ? folders : [];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreating(true);
    try {
      await onFolderCreate(newFolderName.trim(), newFolderDescription.trim() || undefined);
      setNewFolderName('');
      setNewFolderDescription('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="cursor-pointer">
          <Folder className="mr-2 h-4 w-4" />
          <span>Move to Folder</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-48">
          <DropdownMenuItem
            onClick={() => onMoveToFolder(null)}
            className="cursor-pointer"
          >
            <Folder className="mr-2 h-4 w-4" />
            <span>No folder</span>
          </DropdownMenuItem>
          {safeFolders.length > 0 && <DropdownMenuSeparator />}
          {safeFolders.map((folder) => (
            <DropdownMenuItem
              key={folder.id}
              onClick={() => onMoveToFolder(folder.id)}
              className="cursor-pointer"
            >
              <Folder className="mr-2 h-4 w-4" />
              <span>{folder.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create folder</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"></div>
              <DialogHeader className="space-y-3 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FolderPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold text-gray-900 ">
                      Create New Folder
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 ">
                      Organize your agents with a custom folder
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 py-2">
                <div className="space-y-3">
                  <label htmlFor="folderName" className="block text-sm font-semibold text-gray-900 ">
                    Folder Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Customer Support Agents"
                    className="w-full px-4 py-3 border-2 border-gray-200  rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200  transition-all duration-200 bg-gray-50  text-gray-900  placeholder-gray-500 "
                  />
                </div>
                
                <div className="space-y-3">
                  <label htmlFor="folderDescription" className="block text-sm font-semibold text-gray-900 ">
                    Description <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                  </label>
                  <Textarea
                    id="folderDescription"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    placeholder="e.g., All agents handling customer support for our main clients"
                    className="w-full px-4 py-3 border-2 border-gray-200  rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200  transition-all duration-200 bg-gray-50  text-gray-900  placeholder-gray-500  resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter className="flex gap-3 pt-6 border-t border-gray-200 ">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateFolder} 
                  disabled={isCreating || !newFolderName.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isCreating ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FolderPlus className="w-4 h-4" />
                      <span>Create Folder</span>
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}
