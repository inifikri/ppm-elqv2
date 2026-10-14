import { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { WizardShell } from '@/components/assessment/wizard/wizard-shell';
import { WizardStep } from '@/components/assessment/wizard/wizard-step';
import { WizardActionBar } from '@/components/assessment/wizard/wizard-action-bar';
import { QuestionsLoader } from '@/components/assessment/questions-loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    ArrowLeft,
    Send,
    UserCheck,
    Users,
    ShieldCheck,
    Clock,
    CheckCircle2,
    Edit2,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const TOTAL_STEPS = 7;

const STEP_TITLES: Record<number, string> = {
    1: 'Informasi Asesmen',
    2: 'Panduan Penilai',
    3: 'Atasan Langsung',
    4: 'Bawahan 1',
    5: 'Bawahan 2',
    6: 'Bawahan 3',
    7: 'Tinjau & Kirim',
};

export default function EvaluatorsSetup({
    participantEmail,
    totalQuestions,
}: {
    participantEmail: string;
    totalQuestions?: number;
}) {
    const [step, setStep] = useState<number>(1);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const { data, setData, post, processing, errors } = useForm({
        boss_email: '',
        subordinate_emails: ['', '', ''] as [string, string, string],
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const myEmail = participantEmail.toLowerCase().trim();

    // Sinkronkan step dengan history back/forward HP
    useEffect(() => {
        window.history.replaceState({ step: 1 }, '', window.location.pathname);

        const handlePopState = (e: PopStateEvent) => {
            if (e.state && typeof e.state.step === 'number') {
                setStep(e.state.step);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const goToStep = (nextStep: number) => {
        window.history.pushState({ step: nextStep }, '', `${window.location.pathname}?step=${nextStep}`);
        setStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubChange = (index: number, val: string) => {
        const next = [...data.subordinate_emails] as [string, string, string];
        next[index] = val;
        setData('subordinate_emails', next);

        // Bersihkan error field saat mengetik
        const errKey = `subordinate_${index}`;
        if (clientErrors[errKey]) {
            setClientErrors((prev) => {
                const copy = { ...prev };
                delete copy[errKey];
                return copy;
            });
        }
    };

    const handleBossChange = (val: string) => {
        setData('boss_email', val);
        if (clientErrors.boss_email) {
            setClientErrors((prev) => {
                const copy = { ...prev };
                delete copy.boss_email;
                return copy;
            });
        }
    };

    // Validasi per langkah
    const validateStep = (current: number): boolean => {
        const errs: Record<string, string> = {};
        const boss = data.boss_email.trim().toLowerCase();
        const subs = data.subordinate_emails.map((e) => e.trim().toLowerCase());

        if (current === 3) {
            if (!boss) {
                errs.boss_email = 'Email atasan wajib diisi.';
            } else if (!emailRegex.test(boss)) {
                errs.boss_email = 'Format email tidak valid (contoh: nama@perusahaan.com).';
            } else if (boss === myEmail) {
                errs.boss_email = 'Email atasan tidak boleh menggunakan email Anda sendiri.';
            }
        }

        if (current === 4) {
            const s0 = subs[0];
            if (!s0) {
                errs.subordinate_0 = 'Email bawahan 1 wajib diisi.';
            } else if (!emailRegex.test(s0)) {
                errs.subordinate_0 = 'Format email tidak valid.';
            } else if (s0 === myEmail) {
                errs.subordinate_0 = 'Email tidak boleh menggunakan email Anda sendiri.';
            } else if (s0 === boss) {
                errs.subordinate_0 = 'Email bawahan 1 tidak boleh sama dengan atasan.';
            }
        }

        if (current === 5) {
            const s1 = subs[1];
            if (!s1) {
                errs.subordinate_1 = 'Email bawahan 2 wajib diisi.';
            } else if (!emailRegex.test(s1)) {
                errs.subordinate_1 = 'Format email tidak valid.';
            } else if (s1 === myEmail) {
                errs.subordinate_1 = 'Email tidak boleh menggunakan email Anda sendiri.';
            } else if (s1 === boss) {
                errs.subordinate_1 = 'Email bawahan 2 tidak boleh sama dengan atasan.';
            } else if (s1 === subs[0]) {
                errs.subordinate_1 = 'Email bawahan 2 tidak boleh sama dengan bawahan 1.';
            }
        }

        if (current === 6) {
            const s2 = subs[2];
            if (!s2) {
                errs.subordinate_2 = 'Email bawahan 3 wajib diisi.';
            } else if (!emailRegex.test(s2)) {
                errs.subordinate_2 = 'Format email tidak valid.';
            } else if (s2 === myEmail) {
                errs.subordinate_2 = 'Email tidak boleh menggunakan email Anda sendiri.';
            } else if (s2 === boss) {
                errs.subordinate_2 = 'Email bawahan 3 tidak boleh sama dengan atasan.';
            } else if (s2 === subs[0] || s2 === subs[1]) {
                errs.subordinate_2 = 'Email bawahan 3 tidak boleh sama dengan bawahan lainnya.';
            }
        }

        setClientErrors((prev) => ({ ...prev, ...errs }));
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (!validateStep(step)) {
            toast.error('Harap isi data dengan benar sebelum melanjutkan.');
            return;
        }
        goToStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) {
            goToStep(step - 1);
        }
    };

    const handleFinalSubmit = () => {
        post('/participant/evaluators', {
            preserveScroll: true,
            onError: (serverErrors) => {
                toast.error('Terjadi kesalahan validasi penilai.');

                // Arahkan otomatis ke langkah yang bermasalah
                if (serverErrors.boss_email) {
                    goToStep(3);
                } else if (serverErrors['subordinate_emails.0'] || serverErrors.subordinate_emails) {
                    goToStep(4);
                } else if (serverErrors['subordinate_emails.1']) {
                    goToStep(5);
                } else if (serverErrors['subordinate_emails.2']) {
                    goToStep(6);
                }
            },
        });
    };

    if (processing) {
        return (
            <div className="flex min-h-[60dvh] items-center justify-center py-12">
                <QuestionsLoader isResuming={false} />
            </div>
        );
    }

    return (
        <WizardShell
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            stepTitle={STEP_TITLES[step]}
            actionBar={
                <WizardActionBar
                    primaryLabel={
                        step === 1
                            ? 'Mulai Pendaftaran'
                            : step === 7
                            ? 'Kirim Undangan & Mulai Asesmen'
                            : 'Lanjut'
                    }
                    onPrimaryClick={step === 7 ? handleFinalSubmit : handleNext}
                    primaryIcon={step === 7 ? <Send className="size-4" /> : <ArrowRight className="size-4" />}
                    primaryLoading={processing}
                    secondaryLabel={step > 1 ? 'Kembali' : undefined}
                    onSecondaryClick={step > 1 ? handleBack : undefined}
                    secondaryIcon={<ArrowLeft className="size-4" />}
                />
            }
        >
            <Head title={`Langkah ${step} dari ${TOTAL_STEPS}: ${STEP_TITLES[step]} - ELQ 360°`} />

            {/* ================= STEP 1: INFORMASI ================= */}
            {step === 1 && (
                <WizardStep
                    badge="Langkah 1: Informasi Asesmen"
                    title="Selamat Datang di Asesmen Kepemimpinan ELQ 360°"
                    description="Evaluasi multi-rater untuk mengukur efektivitas kepemimpinan secara objektif."
                >
                    <div className="space-y-4 pt-1">
                        <Card className="border border-border/80 shadow-none">
                            <CardContent className="p-4 sm:p-5 space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <Users className="size-4" />
                                    </div>
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Metode Penilaian 360 Derajat
                                    </h2>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    Asesmen ini memadukan sudut pandang evaluasi diri Anda dengan umpan balik dari atasan dan rekan bawahan langsung untuk menghasilkan profil kepemimpinan yang utuh.
                                </p>
                            </CardContent>
                        </Card>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Card className="border border-border/80 shadow-none">
                                <CardContent className="p-4 space-y-1.5">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <ShieldCheck className="size-4" />
                                        <h3 className="text-xs font-semibold">Objektif &amp; Terjaga</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Seluruh respons bawahan diagregatkan tanpa mengekspos skor perorangan kepada peserta.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border border-border/80 shadow-none">
                                <CardContent className="p-4 space-y-1.5">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                        <Clock className="size-4" />
                                        <h3 className="text-xs font-semibold">
                                            {totalQuestions ? `${totalQuestions} Butir Pertanyaan` : 'Butir Pertanyaan'}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Selesai mendaftarkan penilai, Anda akan langsung mengisi kuesioner mandiri (± 15 menit).
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </WizardStep>
            )}

            {/* ================= STEP 2: PANDUAN ================= */}
            {step === 2 && (
                <WizardStep
                    badge="Langkah 2: Panduan Penilai"
                    title="Ketentuan Rekan Penilai yang Didaftarkan"
                    description="Siapkan alamat email aktif dari rekan kerja yang relevan."
                >
                    <Card className="border border-border/80 shadow-none">
                        <CardContent className="p-4 sm:p-5 space-y-3.5">
                            <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                <div className="flex items-start gap-2.5">
                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">1</span>
                                    <div>
                                        <strong className="text-foreground">1 Atasan Langsung:</strong> Pimpinan yang membimbing dan mengamati kepemimpinan Anda secara langsung.
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">2</span>
                                    <div>
                                        <strong className="text-foreground">3 Rekan Bawahan Langsung:</strong> Anggota tim kerja yang berada di bawah koordinasi Anda.
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">3</span>
                                    <div>
                                        <strong className="text-foreground">Satu Kali Pendaftaran:</strong> Setelah dikirim, daftar email penilai terkunci permanen dan tidak dapat diubah mandiri.
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </WizardStep>
            )}

            {/* ================= STEP 3: ATASAN ================= */}
            {step === 3 && (
                <WizardStep
                    badge="Langkah 3: Atasan Langsung"
                    title="Alamat Email Atasan Langsung"
                    description="Undangan penilaian akan otomatis dikirimkan ke alamat email ini."
                >
                    <div className="space-y-2">
                        <Label htmlFor="boss_email" className="text-xs font-semibold text-foreground">
                            Email Atasan <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="boss_email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            placeholder="nama.atasan@perusahaan.com"
                            value={data.boss_email}
                            onChange={(e) => handleBossChange(e.target.value)}
                            className="h-12 text-base sm:text-sm"
                            aria-invalid={Boolean(clientErrors.boss_email || errors.boss_email)}
                            aria-describedby="boss-error"
                        />
                        {(clientErrors.boss_email || errors.boss_email) && (
                            <p id="boss-error" className="text-xs font-medium text-destructive">
                                {clientErrors.boss_email || errors.boss_email}
                            </p>
                        )}
                        <p className="text-[11px] text-muted-foreground pt-1">
                            Pastikan alamat email aktif dan bukan email Anda sendiri ({participantEmail}).
                        </p>
                    </div>
                </WizardStep>
            )}

            {/* ================= STEP 4: BAWAHAN 1 ================= */}
            {step === 4 && (
                <WizardStep
                    badge="Langkah 4: Bawahan 1"
                    title="Alamat Email Bawahan Langsung (1/3)"
                    description="Rekan kerja bawahan langsung pertama Anda."
                >
                    <div className="space-y-2">
                        <Label htmlFor="sub_0" className="text-xs font-semibold text-foreground">
                            Email Bawahan 1 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="sub_0"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            placeholder="nama.bawahan1@perusahaan.com"
                            value={data.subordinate_emails[0]}
                            onChange={(e) => handleSubChange(0, e.target.value)}
                            className="h-12 text-base sm:text-sm"
                            aria-invalid={Boolean(clientErrors.subordinate_0 || errors['subordinate_emails.0'])}
                            aria-describedby="sub-0-error"
                        />
                        {(clientErrors.subordinate_0 || errors['subordinate_emails.0']) && (
                            <p id="sub-0-error" className="text-xs font-medium text-destructive">
                                {clientErrors.subordinate_0 || errors['subordinate_emails.0']}
                            </p>
                        )}
                    </div>
                </WizardStep>
            )}

            {/* ================= STEP 5: BAWAHAN 2 ================= */}
            {step === 5 && (
                <WizardStep
                    badge="Langkah 5: Bawahan 2"
                    title="Alamat Email Bawahan Langsung (2/3)"
                    description="Rekan kerja bawahan langsung kedua Anda."
                >
                    <div className="space-y-2">
                        <Label htmlFor="sub_1" className="text-xs font-semibold text-foreground">
                            Email Bawahan 2 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="sub_1"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            placeholder="nama.bawahan2@perusahaan.com"
                            value={data.subordinate_emails[1]}
                            onChange={(e) => handleSubChange(1, e.target.value)}
                            className="h-12 text-base sm:text-sm"
                            aria-invalid={Boolean(clientErrors.subordinate_1 || errors['subordinate_emails.1'])}
                            aria-describedby="sub-1-error"
                        />
                        {(clientErrors.subordinate_1 || errors['subordinate_emails.1']) && (
                            <p id="sub-1-error" className="text-xs font-medium text-destructive">
                                {clientErrors.subordinate_1 || errors['subordinate_emails.1']}
                            </p>
                        )}
                    </div>
                </WizardStep>
            )}

            {/* ================= STEP 6: BAWAHAN 3 ================= */}
            {step === 6 && (
                <WizardStep
                    badge="Langkah 6: Bawahan 3"
                    title="Alamat Email Bawahan Langsung (3/3)"
                    description="Rekan kerja bawahan langsung ketiga Anda."
                >
                    <div className="space-y-2">
                        <Label htmlFor="sub_2" className="text-xs font-semibold text-foreground">
                            Email Bawahan 3 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="sub_2"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            placeholder="nama.bawahan3@perusahaan.com"
                            value={data.subordinate_emails[2]}
                            onChange={(e) => handleSubChange(2, e.target.value)}
                            className="h-12 text-base sm:text-sm"
                            aria-invalid={Boolean(clientErrors.subordinate_2 || errors['subordinate_emails.2'])}
                            aria-describedby="sub-2-error"
                        />
                        {(clientErrors.subordinate_2 || errors['subordinate_emails.2']) && (
                            <p id="sub-2-error" className="text-xs font-medium text-destructive">
                                {clientErrors.subordinate_2 || errors['subordinate_emails.2']}
                            </p>
                        )}
                    </div>
                </WizardStep>
            )}

            {/* ================= STEP 7: TINJAU & KIRIM ================= */}
            {step === 7 && (
                <WizardStep
                    badge="Langkah 7: Tinjau & Kirim"
                    title="Tinjau Ringkasan Penilai 360°"
                    description="Periksa kembali sebelum mengirimkan undangan penilaian."
                >
                    <div className="space-y-3">
                        {/* Atasan Recap */}
                        <Card className="border border-border/80 shadow-none">
                            <CardContent className="p-3.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <UserCheck className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                                            Atasan Langsung (1/1)
                                        </p>
                                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                            {data.boss_email}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => goToStep(3)}
                                    className="size-8 text-primary hover:text-primary"
                                    aria-label="Ubah email atasan"
                                >
                                    <Edit2 className="size-3.5" />
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 3 Bawahan Recap */}
                        {data.subordinate_emails.map((email, idx) => (
                            <Card key={idx} className="border border-border/80 shadow-none">
                                <CardContent className="p-3.5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                            <Users className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                                                Bawahan Langsung ({idx + 1}/3)
                                            </p>
                                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                                {email}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => goToStep(4 + idx)}
                                        className="size-8 text-primary hover:text-primary"
                                        aria-label={`Ubah email bawahan ${idx + 1}`}
                                    >
                                        <Edit2 className="size-3.5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        {/* General Server Errors if any */}
                        {(errors.email || errors.evaluators) && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                <span>{errors.email || errors.evaluators}</span>
                            </div>
                        )}
                    </div>
                </WizardStep>
            )}
        </WizardShell>
    );
}
