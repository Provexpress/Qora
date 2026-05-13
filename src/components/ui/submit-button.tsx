"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, ButtonProps } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingText = "Guardando...",
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" disabled={pending || props.disabled}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingText : children}
    </Button>
  );
}
