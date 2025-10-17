export type WSHandler<T = unknown> = (payload: T) => void;

export class WebSocketEventRegistry {
  private handlers: Map<string, Set<WSHandler<any>>> = new Map();

  /**
   * Register a handler for an event.
   * Returns a function to unregister the handler (convenience).
   */
  register<T = unknown>(event: string, handler: WSHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    set.add(handler as WSHandler<any>);
    return () => this.unregister(event, handler);
  }

  /**
   * Unregister a handler for an event.
   */
  unregister<T = unknown>(event: string, handler: WSHandler<T>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler as WSHandler<any>);
    if (set.size === 0) {
      this.handlers.delete(event);
    }
  }

  /**
   * Emit an event to all registered handlers for that event.
   * Handlers are invoked synchronously in registration order (iteration order of Set).
   */
  emit<T = unknown>(event: string, payload: T): void {
    const set = this.handlers.get(event);
    if (!set || set.size === 0) return;
    // copy handlers to avoid mutation issues during iteration
    const handlers = Array.from(set.values());
    for (const h of handlers) {
      try {
        (h as WSHandler<T>)(payload);
      } catch (err) {
        // best-effort: don't let one handler break others
        // eslint-disable-next-line no-console
        console.error(`[WebSocketEventRegistry] handler for "${event}" threw`, err);
      }
    }
  }

  /**
   * Clear all handlers (useful for cleanup on disconnect or app teardown).
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Helper: check if any handlers exist for event
   */
  has(event: string): boolean {
    const set = this.handlers.get(event);
    return !!set && set.size > 0;
  }

  /**
   * For debugging: list registered events
   */
  listEvents(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Export a default singleton for convenience (can be replaced with new instance for testing)
export const globalWebSocketEventRegistry = new WebSocketEventRegistry();