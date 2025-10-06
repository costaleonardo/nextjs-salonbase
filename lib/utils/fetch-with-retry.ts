/**
 * Fetch with automatic retry logic for mobile networks
 * Handles transient network failures gracefully
 */

type RetryOptions = {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
};

/**
 * Executes an async function with exponential backoff retry logic
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoffMultiplier = 2, onRetry } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Checks if an error is a network error that should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("connection")
  );
}

/**
 * Server Action wrapper with retry logic
 * Use this to wrap server action calls from client components
 */
export async function serverActionWithRetry<T>(
  action: () => Promise<{ success: boolean; data?: T; error?: string }>,
  options: RetryOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    return await fetchWithRetry(action, {
      maxRetries: options.maxRetries || 2, // Lower retries for server actions
      delayMs: options.delayMs || 500,
      backoffMultiplier: options.backoffMultiplier || 1.5,
      onRetry: options.onRetry,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Hook for using retry logic in React components
 * @example
 * const { execute, isLoading, error } = useRetry(async () => {
 *   return await createBooking(data)
 * })
 */
export function useRetryState() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const execute = async <T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      const result = await fetchWithRetry(fn, {
        ...options,
        onRetry: (attempt) => {
          setRetryCount(attempt);
          options?.onRetry?.(attempt, new Error("Retrying..."));
        },
      });
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
      return null;
    }
  };

  return { execute, isLoading, error, retryCount };
}

// React import for the hook
import React from "react";
