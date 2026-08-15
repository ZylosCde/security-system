import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface QrCheckpointData {
  name: string;
  code: string;
  dataUrl: string;
  token: string;
}

export function CheckpointQrDialog({
  qrCheckpoint,
  onClose,
}: {
  qrCheckpoint: QrCheckpointData;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <h2 className="mb-1 text-lg font-semibold">Checkpoint QR</h2>
        <p className="mb-4 text-sm text-muted-foreground">{qrCheckpoint.name}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrCheckpoint.dataUrl}
          alt={`QR for ${qrCheckpoint.name}`}
          className="mx-auto rounded-lg border border-border bg-white p-2"
          width={220}
          height={220}
        />
        <p className="mt-3 font-mono text-sm">{qrCheckpoint.code}</p>
        <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground/80">
          {qrCheckpoint.token}
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            onClick={() => {
              void navigator.clipboard.writeText(qrCheckpoint.token);
              toast.success("QR payload copied");
            }}
          >
            Copy payload
          </Button>
          <Button className="flex-1 rounded-2xl" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
