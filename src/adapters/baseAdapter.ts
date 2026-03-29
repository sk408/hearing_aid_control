import { getRegistryEntriesForBrand } from "../registry/protocolRegistry";
import { SafetyGate } from "../safety/safetyGate";
import type { Operation } from "../domain/model";
import type { AdapterContext, BrandAdapter, DriverState } from "./types";

export abstract class BaseAdapter implements BrandAdapter {
  public abstract readonly brand: BrandAdapter["brand"];
  protected readonly safetyGate = new SafetyGate();

  public constructor(protected readonly context: AdapterContext) {}

  public async connect(): Promise<void> {
    return Promise.resolve();
  }

  public async disconnect(): Promise<void> {
    return this.context.transport.disconnect();
  }

  public getCapabilities() {
    return getRegistryEntriesForBrand(this.brand).map((entry) => this.context.capabilityResolver(entry.operation));
  }

  public async execute(operation: Operation, args: Record<string, number | boolean | string> = {}): Promise<void> {
    const decision = this.context.capabilityResolver(operation);
    this.safetyGate.assertExecutable(decision);

    this.context.diagnostics.emit({
      type: "operation.start",
      brand: this.brand,
      operation,
      detail: `Executing ${operation}`
    });

    try {
      await this.executeInternal(operation, args);
      this.context.diagnostics.emit({
        type: "operation.success",
        brand: this.brand,
        operation,
        detail: `${operation} completed`
      });
    } catch (error) {
      this.context.diagnostics.emit({
        type: "operation.error",
        brand: this.brand,
        operation,
        detail: (error as Error).message
      });
      throw error;
    }
  }

  public abstract refreshState(): Promise<DriverState>;

  protected abstract executeInternal(
    operation: Operation,
    args: Record<string, number | boolean | string>
  ): Promise<void>;
}
