interface Props { message: string; onConfirm: () => void; onCancel: () => void; }
export function Confirm({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true">
      <div className="confirm">
        <p>{message}</p>
        <div className="confirm-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="danger" onClick={onConfirm}>Replace data</button>
        </div>
      </div>
    </div>
  );
}
