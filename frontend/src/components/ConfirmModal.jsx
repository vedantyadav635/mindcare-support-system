/**
 * ConfirmModal: "Are you sure?" before something that can't easily be undone (cancel, decline).
 * request = { title, text, confirmLabel, onConfirm } to show it, or null to hide it.
 */
import { Button, Modal } from "./ui";

export default function ConfirmModal({ request, onClose, busy = false }) {
  return (
    <Modal
      open={Boolean(request)}
      onClose={onClose}
      title={request?.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{request?.cancelLabel ?? "Keep it"}</Button>
          <Button variant="danger" onClick={() => request.onConfirm()} loading={busy}>{request?.confirmLabel}</Button>
        </>
      }
    >
      <p>{request?.text}</p>
    </Modal>
  );
}
