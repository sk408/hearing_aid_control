import { useState } from "react";
import type { GattServiceInfo } from "../transport/types";

interface GattExplorerProps {
  /** Full GATT tree of the primary aid (from Transport.explore()). */
  readonly tree: readonly GattServiceInfo[];
  readonly connected: boolean;
  /** Read one characteristic (Advanced-view verified read path). */
  readonly onRead: (characteristicUuid: string) => Promise<Uint8Array>;
}

function toHex(value: Uint8Array): string {
  return Array.from(value)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

function toAscii(value: Uint8Array): string {
  const text = Array.from(value)
    .map((byte) => (byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : "."))
    .join("")
    .replace(/\.+$/, "");
  return text.replace(/\./g, " ").trim();
}

interface ReadState {
  readonly status: "idle" | "reading" | "ok" | "error";
  readonly text?: string;
}

/**
 * GATT explorer (Advanced view) — the discovery tool for surfaces beyond the
 * standardized MFi/LEA characteristics (e.g. a future EQ/tone control). Lists
 * every service/characteristic with UUID and property flags; values are read
 * ON DEMAND per characteristic (reading everything up front would spam the
 * link and could trigger pairing prompts on secured characteristics).
 */
export function GattExplorer({ tree, connected, onRead }: GattExplorerProps): JSX.Element {
  const [reads, setReads] = useState<Record<string, ReadState>>({});

  const readOne = async (uuid: string): Promise<void> => {
    setReads((prev) => ({ ...prev, [uuid]: { status: "reading" } }));
    try {
      const value = await onRead(uuid);
      const ascii = toAscii(value);
      setReads((prev) => ({
        ...prev,
        [uuid]: {
          status: "ok",
          text: `[${Array.from(value).join(",")}]${ascii ? `  "${ascii}"` : ""}  (${toHex(value)})`
        }
      }));
    } catch (error) {
      setReads((prev) => ({
        ...prev,
        [uuid]: { status: "error", text: (error as Error).message }
      }));
    }
  };

  if (tree.length === 0) {
    return (
      <section>
        <h3>GATT Explorer</h3>
        <p className="control-note">Connect a hearing aid to enumerate its services and characteristics.</p>
      </section>
    );
  }

  return (
    <section>
      <h3>GATT Explorer</h3>
      <p className="control-note">
        Every discovered service/characteristic with its property flags. Values are read on demand — secured
        characteristics may require pairing and can legitimately fail.
      </p>
      {tree.map((service) => (
        <div key={service.uuid} className="explorer-service">
          <p className="explorer-service-uuid">Service {service.uuid}</p>
          <ul>
            {service.characteristics.map((characteristic) => {
              const state = reads[characteristic.uuid] ?? { status: "idle" as const };
              const readable = characteristic.properties.includes("read");
              return (
                <li key={characteristic.uuid} className="explorer-char">
                  <span className="explorer-char-uuid">{characteristic.uuid}</span>{" "}
                  <span className="explorer-char-props">{characteristic.properties.join(" ") || "no properties"}</span>{" "}
                  {readable ? (
                    <button onClick={() => void readOne(characteristic.uuid)} disabled={!connected || state.status === "reading"}>
                      {state.status === "reading" ? "Reading..." : "Read"}
                    </button>
                  ) : null}
                  {state.text ? (
                    <span className={`explorer-char-value ${state.status === "error" ? "explorer-read-error" : ""}`}>
                      {" "}
                      {state.text}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
