interface DiagnosticsPanelProps {
  readonly messages: readonly string[];
}

export function DiagnosticsPanel({ messages }: DiagnosticsPanelProps): JSX.Element {
  return (
    <section>
      <h3>Diagnostics</h3>
      <div className="diagnostics">
        {messages.length === 0 ? <p>No diagnostic events yet.</p> : null}
        {messages.map((message, index) => (
          <div key={`${message}-${index}`}>{message}</div>
        ))}
      </div>
    </section>
  );
}
