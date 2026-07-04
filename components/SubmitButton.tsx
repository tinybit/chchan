"use client";

import { useFormStatus } from "react-dom";

/** Submit button that shows a spinner and locks while the action runs. */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending && <span className="spinner" aria-hidden />}
      {children}
    </button>
  );
}
