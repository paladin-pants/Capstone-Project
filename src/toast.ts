// Displays a toast message of a given type
export function showToast( message: string, type: "success" | "danger" | "warning" = "success" ): void {
  const toastElement = document.getElementById("successToast");
  const toastBody = document.getElementById("successToastBody");

  if (!toastElement || !toastBody) return;

  toastBody.textContent = message;

  toastElement.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning");
  toastElement.classList.add(`text-bg-${type}`);

  const toast =
    (window as any).bootstrap.Toast.getOrCreateInstance(toastElement);

  toast.show();
}
