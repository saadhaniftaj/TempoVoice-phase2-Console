'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  const { onOpenChange } = React.useContext(DialogContext);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange(true),
    } as React.HTMLAttributes<HTMLElement>);
  }
  
  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  const { open, onOpenChange } = React.useContext(DialogContext);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-gray-200 ${className}`}>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-all duration-200"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return (
    <div className={`px-6 pt-6 pb-2 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div className={`px-6 py-4 flex justify-end space-x-2 ${className}`}>
      {children}
    </div>
  );
}
