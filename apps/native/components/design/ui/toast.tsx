import { useState, useEffect } from "react";
import { View, Text } from "react-native";

interface ToastOptions {
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message?: string;
}

let toastHandlers: ((options: ToastOptions) => void) | null = null;

export function showToast(options: ToastOptions) {
  toastHandlers?.(options);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  useEffect(() => {
    toastHandlers = (options) => {
      setToasts((prev) => [...prev, options]);
      setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3000);
    };

    return () => {
      toastHandlers = null;
    };
  }, []);

  return { toasts };
}

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <View className="absolute top-4 left-4 right-4 z-50">
      {toasts.map((toast, index) => (
        <View
          key={index}
          className={`mb-2 rounded-lg p-4 shadow-lg ${toast.type === "error" ? "bg-destructive" : toast.type === "warning" ? "bg-yellow-500" : toast.type === "info" ? "bg-blue-500" : "bg-green-500"}`}
        >
          {toast.title && (
            <Text className="font-bold text-white mb-1">{toast.title}</Text>
          )}
          {toast.message && (
            <Text className="text-white">{toast.message}</Text>
          )}
        </View>
      ))}
    </View>
  );
}
