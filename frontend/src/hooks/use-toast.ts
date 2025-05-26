// src/hooks/use-toast.ts
export const useToast = () => {
  return {
    toast: ({ title, description }: { title: string; description?: string }) => {
      alert(`${title}\n${description ?? ""}`)
    }
  }
}
