import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  maxWidth?: string;
  children: ReactNode;
  title?: string;
  /** Extra classes on the overlay div */
  overlayClassName?: string;
  /** Extra classes on the content panel */
  panelClassName?: string;
}

/**
 * Shared modal overlay. Renders a centered panel over a dimmed backdrop.
 * Clicking the backdrop calls onClose (if provided).
 */
export function Modal({
  open,
  onClose,
  maxWidth = 'max-w-md',
  children,
  title,
  overlayClassName,
  panelClassName,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${overlayClassName ?? ''}`}
      onClick={onClose}
    >
      <div
        className={`rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-xl ${maxWidth} w-full mx-4 p-6 ${panelClassName ?? ''}`}
        onClick={e => e.stopPropagation()}
      >
        {title && <h3 className="text-base font-semibold mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
