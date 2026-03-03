export type ToastTone = "error" | "info" | "success";

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  tone: ToastTone;
}
