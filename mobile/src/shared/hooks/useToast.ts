import { useCallback } from "react";
import Toast from "react-native-toast-message";

export type ToastTone = "error" | "info" | "success";

const TONE_MAP: Record<ToastTone, string> = {
  error: "error",
  info: "info",
  success: "success",
};

export function useToast() {
  const push = useCallback((body: string, title: string, tone: ToastTone) => {
    Toast.show({
      type: TONE_MAP[tone],
      text1: title,
      text2: body,
      visibilityTime: tone === "error" ? 5000 : 3000,
      position: "bottom",
    });
  }, []);

  return { push };
}
