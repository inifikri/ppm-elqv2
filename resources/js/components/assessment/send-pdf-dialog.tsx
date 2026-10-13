import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function SendPdfDialog({
    open,
    onOpenChange,
    participantId,
    participantName,
    participantEmail,
    actionUrl,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    participantId: number;
    participantName: string;
    participantEmail: string;
    actionUrl: string;
}) {
    const [submitting, setSubmitting] = useState(false);

    const handleSend = () => {
        if (submitting) return;

        setSubmitting(true);
        router.post(
            actionUrl,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`PDF hasil assessment berhasil dijadwalkan ke ${participantEmail}`);
                    onOpenChange(false);
                },
                onError: () => {
                    toast.error('Gagal menjadwalkan pengiriman PDF.');
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            }
        );
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Mail className="size-5 text-primary" />
                        Kirim Laporan PDF ke Peserta?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-left pt-2 text-sm text-muted-foreground">
                            <span>Laporan hasil assessment untuk peserta:</span>
                            <div className="rounded-md border bg-muted/50 p-3 text-sm">
                                <div className="font-semibold text-foreground">{participantName}</div>
                                <div className="text-muted-foreground">{participantEmail}</div>
                            </div>
                            <span className="text-xs text-muted-foreground block">
                                File PDF akan digenerate dan dikirim langsung ke alamat email terdaftar di atas melalui antrean email sistem.
                            </span>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
                    <Button
                        type="button"
                        disabled={submitting}
                        onClick={handleSend}
                        className="gap-2"
                    >
                        {submitting && <Loader2 className="size-4 animate-spin" />}
                        {submitting ? 'Mengirim...' : 'Kirim Sekarang'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
