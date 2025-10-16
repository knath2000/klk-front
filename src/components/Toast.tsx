"use client";

// Lightweight toast helper that does not require additional context/providers.
// Usage: import { showToast } from '@/components/Toast' and call showToast('Saved', 'success')
export type ToastType = "success" | "error" | "info";

function ensureContainer(): HTMLElement {
  let container = document.getElementById('klk-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'klk-toast-container';
    Object.assign(container.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'flex-end',
      pointerEvents: 'none'
    });
    document.body.appendChild(container);
  }
  return container;
}

function createToastNode(message: string, type: ToastType) {
  const toast = document.createElement('div');
  toast.className = `klk-toast klk-toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  Object.assign(toast.style, {
    pointerEvents: 'auto',
    minWidth: '220px',
    maxWidth: '360px',
    padding: '10px 14px',
    borderRadius: '8px',
    color: '#fff',
    background: type === 'success' ? '#16a34a' : type === 'error' ? '#ef4444' : '#0ea5e9',
    boxShadow: '0 6px 18px rgba(2,6,23,0.6)',
    fontSize: '14px',
    lineHeight: '1.2',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'opacity 180ms ease, transform 180ms ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  });

  const text = document.createElement('div');
  text.textContent = message;
  toast.appendChild(text);

  return toast;
}

/**
 * Show a toast message.
 * @param message Text to show
 * @param type 'success' | 'error' | 'info'
 * @param duration milliseconds to auto-dismiss (default 4000)
 */
export function showToast(message: string, type: ToastType = 'info', duration = 4000) {
  if (typeof window === 'undefined') return;
  try {
    const container = ensureContainer();
    const node = createToastNode(message, type);
    container.appendChild(node);

    // Force layout so transitions run
    requestAnimationFrame(() => {
      node.style.opacity = '1';
      node.style.transform = 'translateY(0)';
    });

    const dismiss = () => {
      node.style.opacity = '0';
      node.style.transform = 'translateY(8px)';
      setTimeout(() => {
        try { node.remove(); } catch {}
        // If container empty, remove it
        if (container && container.children.length === 0) {
          try { container.remove(); } catch {}
        }
      }, 200);
    };

    const timer = setTimeout(dismiss, duration);

    // Dismiss on click
    node.addEventListener('click', () => {
      clearTimeout(timer);
      dismiss();
    });
  } catch (e) {
    // Fail silently
    // eslint-disable-next-line no-console
    console.error('showToast error', e);
  }
}