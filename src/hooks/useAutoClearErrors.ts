// src/hooks/useAutoClearErrors.ts
import { useState, useEffect } from 'react';

export function useAutoClearErrors(timeoutMs = 3000) {
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), timeoutMs);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, timeoutMs]);

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(""), timeoutMs);
      return () => clearTimeout(timer);
    }
  }, [actionError, timeoutMs]);

  return { errorMessage, setErrorMessage, actionError, setActionError };
}