import type { CapabilityDecision } from "../domain/model";

interface CapabilityTableProps {
  readonly capabilities: readonly CapabilityDecision[];
}

export function CapabilityTable({ capabilities }: CapabilityTableProps): JSX.Element {
  if (capabilities.length === 0) {
    return <p>No capability data yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Operation</th>
          <th>Status</th>
          <th>Safety</th>
          <th>Confidence</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {capabilities.map((item) => (
          <tr key={`${item.brand}-${item.operation}`}>
            <td>{item.operation}</td>
            <td>{item.status}</td>
            <td>{item.entry?.safetyClass ?? "n/a"}</td>
            <td>{item.entry?.confidence ?? "n/a"}</td>
            <td>{item.reason}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
