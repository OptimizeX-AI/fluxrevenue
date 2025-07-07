// src/hooks/use-toast.ts
import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
  duration?: number;
  open?: boolean;
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: []
};

let toastState = initialState;
let listeners: Array<(state: ToastState) => void> = [];

const dispatch = (action: { type: string; toast?: Toast; id?: string }) => {
  switch (action.type) {
    case 'ADD_TOAST':
      if (action.toast) {
        toastState = {
          ...toastState,
          toasts: [...toastState.toasts, { ...action.toast, open: true }]
        };
      }
      break;
    case 'REMOVE_TOAST':
      toastState = {
        ...toastState,
        toasts: toastState.toasts.filter((t: Toast) => t.id !== action.id)
      };
      break;
    case 'DISMISS_TOAST':
      toastState = {
        ...toastState,
        toasts: toastState.toasts.map((t: Toast) =>
          t.id === action.id ? { ...t, open: false } : t
        )
      };
      break;
  }

  listeners.forEach((listener: (state: ToastState) => void) => listener(toastState));
};

export const useToast = () => {
  const [state, setState] = useState(toastState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const toast = ({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({
      type: 'ADD_TOAST',
      toast: { id, title, description, variant, duration }
    });

    // Auto-dismiss após duration
    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id });
      }, duration);
    }

    return id;
  };

  const dismiss = (toastId: string) => {
    dispatch({ type: 'REMOVE_TOAST', id: toastId });
  };

  return {
    toast,
    dismiss,
    toasts: state.toasts
  };
};
