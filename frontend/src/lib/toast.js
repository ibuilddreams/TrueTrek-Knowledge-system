import { toast } from "sonner";

export function toastSuccess(message, options) {
  return toast.success(message, options);
}

export function toastError(message, options) {
  return toast.error(message, options);
}

export function toastInfo(message, options) {
  return toast(message, options);
}

export function toastWarning(message, options) {
  return toast.warning(message, options);
}

export function toastPromise(promise, messages, options) {
  return toast.promise(promise, messages, options);
}

export function dismissToast(id) {
  return toast.dismiss(id);
}
