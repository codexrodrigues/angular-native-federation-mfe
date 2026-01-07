export type RetryOptions = {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;
  shouldRetry?: (error: unknown) => boolean;
};

export type CircuitBreakerOptions = {
  failureThreshold: number;
  successThreshold: number;
  openMs: number;
};

export class CircuitBreakerOpenError extends Error {
  readonly openUntil: number;

  constructor(name: string, openUntil: number) {
    super(`[${name}] Circuit breaker open`);
    this.name = 'CircuitBreakerOpenError';
    this.openUntil = openUntil;
  }
}

type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failures = 0;
  private successes = 0;
  private openedAt = 0;

  constructor(private readonly options: CircuitBreakerOptions & { name: string }) {}

  async exec<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.canAttempt()) {
      throw new CircuitBreakerOpenError(this.options.name, this.openUntil());
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canAttempt(): boolean {
    if (this.state === 'open') {
      if (Date.now() >= this.openUntil()) {
        this.toHalfOpen();
        return true;
      }
      return false;
    }

    return true;
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successes += 1;
      if (this.successes >= this.options.successThreshold) {
        this.close();
      }
      return;
    }

    this.failures = 0;
  }

  private onFailure(): void {
    if (this.state === 'half-open') {
      this.open();
      return;
    }

    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) {
      this.open();
    }
  }

  private toHalfOpen(): void {
    this.state = 'half-open';
    this.successes = 0;
    this.failures = 0;
  }

  private open(): void {
    this.state = 'open';
    this.openedAt = Date.now();
    this.successes = 0;
  }

  private close(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.openedAt = 0;
  }

  private openUntil(): number {
    return this.openedAt + this.options.openMs;
  }
}

export class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();

  get(key: string, options: CircuitBreakerOptions): CircuitBreaker {
    const existing = this.breakers.get(key);
    if (existing) {
      return existing;
    }

    const created = new CircuitBreaker({ ...options, name: key });
    this.breakers.set(key, created);
    return created;
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getRetryDelay = (attempt: number, options: RetryOptions): number => {
  const backoff = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** attempt);
  const jitter = options.jitterMs > 0 ? Math.floor(Math.random() * options.jitterMs) : 0;
  return backoff + jitter;
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= options.retries || (options.shouldRetry && !options.shouldRetry(error))) {
        throw error;
      }
      const delayMs = getRetryDelay(attempt, options);
      attempt += 1;
      await delay(delayMs);
    }
  }
};

export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`[${label}] Timeout apos ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  const mergedInit = { ...init, signal: controller.signal };

  try {
    return await fetch(input, mergedInit);
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(`Timeout apos ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
};

export const remoteModuleBreakers = new CircuitBreakerRegistry();
export const remoteFetchBreakers = new CircuitBreakerRegistry();
