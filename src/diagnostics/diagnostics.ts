import type { Brand, Operation } from "../domain/model";

export type DiagnosticEventType =
  | "transport.connect"
  | "transport.disconnect"
  | "transport.read"
  | "transport.write"
  | "transport.notify"
  | "operation.start"
  | "operation.success"
  | "operation.error";

export interface DiagnosticEvent {
  readonly timestamp: number;
  readonly type: DiagnosticEventType;
  readonly brand?: Brand;
  readonly operation?: Operation;
  readonly detail: string;
}

type DiagnosticListener = (event: DiagnosticEvent) => void;

export class DiagnosticsStream {
  private readonly listeners = new Set<DiagnosticListener>();
  private readonly events: DiagnosticEvent[] = [];

  public onEvent(listener: DiagnosticListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emit(event: Omit<DiagnosticEvent, "timestamp">): void {
    const item: DiagnosticEvent = {
      timestamp: Date.now(),
      ...event
    };
    this.events.push(item);
    this.listeners.forEach((listener) => listener(item));
  }

  public getEvents(): readonly DiagnosticEvent[] {
    return this.events;
  }
}
