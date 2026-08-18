import { Button } from "@/components/ui/button";

export interface QrOfficerData {
  name: string;
  nic: string;
  dataUrl: string;
  token: string;
}

export function OfficerQrDialog({
  qrOfficer,
  onClose,
}: {
  qrOfficer: QrOfficerData;
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
        <h2 className="mb-1 text-lg font-semibold">Officer sign-in QR</h2>
        <p className="mb-4 text-sm text-muted-foreground">{qrOfficer.name}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrOfficer.dataUrl}
          alt={`Sign-in QR for ${qrOfficer.name}`}
          className="mx-auto rounded-lg border border-border bg-white p-2"
          width={200}
          height={200}
        />
        <p className="mt-3 font-mono text-sm">{qrOfficer.nic}</p>
        <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground/80">
          {qrOfficer.token}
        </p>
        <Button className="mt-6 w-full rounded-2xl" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
