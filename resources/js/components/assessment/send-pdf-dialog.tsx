import { useState, useId } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Mail,
    Loader2,
    User,
    Users,
    Briefcase,
    Plus,
    X,
    Send,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AvailableRecipientRater = {
    id: number;
    role: string;
    role_label: string;
    email: string;
    is_submitted: boolean;
};

export interface SendPdfDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    participantId: number;
    participantName: string;
    participantEmail: string;
    actionUrl: string;
    raters?: AvailableRecipientRater[];
}

export function SendPdfDialog({
    open,
    onOpenChange,
    participantId: _participantId,
    participantName,
    participantEmail,
    actionUrl,
    raters = [],
}: SendPdfDialogProps) {
    const inputId = useId();
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([
        participantEmail,
    ]);
    const [customEmailInput, setCustomEmailInput] = useState("");
    const [customEmails, setCustomEmails] = useState<string[]>([]);
    const [emailError, setEmailError] = useState<string | null>(null);

    // Filter raters yang punya email valid dan tidak duplikat dengan email peserta
    const externalRaters = raters.filter(
        (r) =>
            r.email && r.email.toLowerCase() !== participantEmail.toLowerCase(),
    );

    const toggleEmail = (email: string) => {
        setSelectedEmails((prev) =>
            prev.includes(email)
                ? prev.filter((e) => e !== email)
                : [...prev, email],
        );
    };

    const handleAddCustomEmail = () => {
        setEmailError(null);
        const email = customEmailInput.trim().toLowerCase();

        if (!email) return;

        // Basic RFC email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError("Format alamat email tidak valid.");
            return;
        }

        const allAvailable = [
            participantEmail.toLowerCase(),
            ...externalRaters.map((r) => r.email.toLowerCase()),
            ...customEmails.map((e) => e.toLowerCase()),
        ];

        if (allAvailable.includes(email)) {
            setEmailError("Alamat email ini sudah ada dalam daftar.");
            return;
        }

        setCustomEmails((prev) => [...prev, email]);
        setSelectedEmails((prev) => [...prev, email]);
        setCustomEmailInput("");
    };

    const handleRemoveCustomEmail = (email: string) => {
        setCustomEmails((prev) => prev.filter((e) => e !== email));
        setSelectedEmails((prev) => prev.filter((e) => e !== email));
    };

    const handleSelectAll = () => {
        const all = [
            participantEmail,
            ...externalRaters.map((r) => r.email),
            ...customEmails,
        ];
        setSelectedEmails(Array.from(new Set(all)));
    };

    const handleDeselectAll = () => {
        setSelectedEmails([]);
    };

    const handleSend = () => {
        if (submitting) return;

        if (selectedEmails.length === 0) {
            toast.error("Pilih minimal satu penerima laporan.");
            return;
        }

        setSubmitting(true);
        router.post(
            actionUrl,
            {
                recipients: selectedEmails,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const count = selectedEmails.length;
                    toast.success(
                        `Laporan PDF hasil assessment berhasil dijadwalkan ke ${count} penerima.`,
                    );
                    onOpenChange(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as
                        | string
                        | undefined;
                    toast.error(
                        firstError ||
                            "Gagal menjadwalkan pengiriman laporan PDF.",
                    );
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <Mail className="size-5 text-primary" />
                        Kirim Laporan Hasil Assessment (PDF)
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Pilih siapa saja yang berhak menerima dokumen PDF hasil
                        evaluasi kepemimpinan 360° untuk peserta ini.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-1 text-sm">
                    {/* Header Pilihan Cepat */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                            Daftar Penerima ({selectedEmails.length} Dipilih)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-primary hover:underline font-medium"
                            >
                                Pilih Semua
                            </button>
                            <span className="text-muted-foreground">
                                &bull;
                            </span>
                            <button
                                type="button"
                                onClick={handleDeselectAll}
                                className="text-muted-foreground hover:text-foreground font-medium"
                            >
                                Hapus Pilihan
                            </button>
                        </div>
                    </div>

                    {/* 2. Penilai Terdaftar (Atasan & Bawahan) */}
                    {externalRaters.length > 0 && (
                        <div className="space-y-2">
                            <div className="space-y-1.5">
                                {externalRaters.map((rater) => {
                                    const isBoss = rater.role === "boss";
                                    const isSelected = selectedEmails.includes(
                                        rater.email,
                                    );

                                    return (
                                        <div
                                            key={rater.id}
                                            onClick={() =>
                                                toggleEmail(rater.email)
                                            }
                                            className={cn(
                                                "flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                                                isSelected
                                                    ? "bg-primary/5 border-primary/40 dark:bg-primary/10 dark:border-primary/50"
                                                    : "bg-card border-border/70 hover:bg-muted/40",
                                            )}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() =>
                                                    toggleEmail(rater.email)
                                                }
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-foreground truncate">
                                                        {rater.email}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-[10px] px-1.5 py-0",
                                                            isBoss
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                                                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
                                                        )}
                                                    >
                                                        {isBoss ? (
                                                            <Briefcase className="size-2.5 mr-1" />
                                                        ) : (
                                                            <Users className="size-2.5 mr-1" />
                                                        )}
                                                        {rater.role_label}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    {rater.is_submitted ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                            <CheckCircle2 className="size-3" />
                                                            Telah menyelesaikan
                                                            penilaian
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 dark:text-amber-400">
                                                            Belum menyelesaikan
                                                            penilaian
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. Email Tambahan / Kustom */}
                    <div className="space-y-2 pt-1 border-t border-border/60">
                        <Label
                            htmlFor={inputId}
                            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-[11px]"
                        >
                            Kirim ke Email Lainnya (HR / Atasan Lanjutan /
                            Klien)
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id={inputId}
                                type="email"
                                placeholder="contoh: hrd@perusahaan.co.id"
                                value={customEmailInput}
                                onChange={(e) => {
                                    setCustomEmailInput(e.target.value);
                                    if (emailError) setEmailError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddCustomEmail();
                                    }
                                }}
                                className="text-xs h-9"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                icon={Plus}
                                onClick={handleAddCustomEmail}
                                className="h-9 text-xs shrink-0"
                            >
                                Tambah
                            </Button>
                        </div>
                        {emailError && (
                            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                <AlertCircle className="size-3" />
                                {emailError}
                            </p>
                        )}

                        {/* List Email Kustom yang Ditambahkan */}
                        {customEmails.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {customEmails.map((email) => {
                                    const isSelected =
                                        selectedEmails.includes(email);

                                    return (
                                        <Badge
                                            key={email}
                                            variant="secondary"
                                            className={cn(
                                                "text-xs py-1 px-2.5 flex items-center gap-1.5 transition-all",
                                                isSelected
                                                    ? "bg-primary/10 text-primary border-primary/30"
                                                    : "bg-muted text-muted-foreground opacity-60",
                                            )}
                                        >
                                            <span
                                                onClick={() =>
                                                    toggleEmail(email)
                                                }
                                                className="cursor-pointer hover:underline"
                                            >
                                                {email}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveCustomEmail(
                                                        email,
                                                    )
                                                }
                                                className="hover:text-destructive p-0.5 rounded-full"
                                                title="Hapus email ini"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={submitting || selectedEmails.length === 0}
                        onClick={handleSend}
                        icon={submitting ? Loader2 : Send}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                        {submitting
                            ? "Menjadwalkan..."
                            : `Kirim Sekarang (${selectedEmails.length})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
