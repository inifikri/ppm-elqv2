import { Head } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Check,
    Loader2,
    Lock,
    Mail,
    RefreshCw,
    ShieldCheck,
    User,
    UserPlus,
} from 'lucide-react';
import type { ClipboardEvent, FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import { CompanyCombobox } from '@/components/auth/company-combobox';
import { PasswordStrength } from '@/components/auth/password-strength';
import { RegisterStepper } from '@/components/auth/register-stepper';
import { RegisterSuccess } from '@/components/auth/register-success';
import { FormField } from '@/components/form-field';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isPasswordValid } from '@/lib/password-rules';
import { cn } from '@/lib/utils';
import { xhr } from '@/lib/xhr';
import { login } from '@/routes';
import { captcha, checkEmail, store } from '@/routes/register';

type EmailStatus =
    | 'idle'
    | 'checking'
    | 'ok'
    | 'invalid'
    | 'domain_not_found'
    | 'taken'
    | 'error';
type PowStatus = 'idle' | 'solving' | 'verified' | 'error';
type PowChallenge = { salt: string; challenge: string; max: number };
type Errors = Partial<Record<string, string>>;

const STEP_ONE_FIELDS = ['name', 'company', 'position', 'captcha_answer'];
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTML_TAG_PATTERN = /<\/?[a-z!][\s\S]*?>/i;
const HTML_TAG_MESSAGE = 'Input tidak boleh mengandung tag HTML.';

const SHA256_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** SHA-256 murni tanpa ketergantungan WebCrypto HTTPS (aman untuk jaringan internal HTTP/HTTPS on-premise). */
function sha256Hex(ascii: string): string {
    const len = ascii.length;
    const totalBytes = (len + 9 + 63) & ~63;
    const words = new Uint32Array(totalBytes >> 2);

    for (let i = 0; i < len; i++) {
        words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i & 3) * 8);
    }
    words[len >> 2] |= 0x80 << (24 - (len & 3) * 8);
    words[words.length - 1] = len * 8;

    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;
    const w = new Uint32Array(64);

    for (let offset = 0; offset < words.length; offset += 16) {
        for (let i = 0; i < 16; i++) {
            w[i] = words[offset + i];
        }
        for (let i = 16; i < 64; i++) {
            const v0 = w[i - 15];
            const s0 =
                ((v0 >>> 7) | (v0 << 25)) ^
                ((v0 >>> 18) | (v0 << 14)) ^
                (v0 >>> 3);
            const v1 = w[i - 2];
            const s1 =
                ((v1 >>> 17) | (v1 << 15)) ^
                ((v1 >>> 19) | (v1 << 13)) ^
                (v1 >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }

        let a = h0;
        let b = h1;
        let c = h2;
        let d = h3;
        let e = h4;
        let f = h5;
        let g = h6;
        let h = h7;

        for (let i = 0; i < 64; i++) {
            const s1 =
                ((e >>> 6) | (e << 26)) ^
                ((e >>> 11) | (e << 21)) ^
                ((e >>> 25) | (e << 7));
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + s1 + ch + SHA256_K[i] + w[i]) | 0;
            const s0 =
                ((a >>> 2) | (a << 30)) ^
                ((a >>> 13) | (a << 19)) ^
                ((a >>> 22) | (a << 10));
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (s0 + maj) | 0;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) | 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) | 0;
        }

        h0 = (h0 + a) | 0;
        h1 = (h1 + b) | 0;
        h2 = (h2 + c) | 0;
        h3 = (h3 + d) | 0;
        h4 = (h4 + e) | 0;
        h5 = (h5 + f) | 0;
        h6 = (h6 + g) | 0;
        h7 = (h7 + h) | 0;
    }

    return [h0, h1, h2, h3, h4, h5, h6, h7]
        .map((n) => (n >>> 0).toString(16).padStart(8, '0'))
        .join('');
}

const emailMessages: Record<string, string> = {
    invalid: 'Format email tidak valid.',
    domain_not_found:
        'Domain email tidak ditemukan. Periksa penulisan email Anda.',
    taken: 'Email ini sudah terdaftar.',
    error: 'Tidak dapat memeriksa email. Periksa koneksi Anda lalu coba lagi.',
};

interface RegisterProps {
    companies?: string[];
}

export default function Register({ companies = [] }: RegisterProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [values, setValues] = useState({
        name: '',
        company: '',
        position: '',
        email: '',
        password: '',
        password_confirmation: '',
        captcha_answer: '',
        website: '', // honeypot
    });
    const [errors, setErrors] = useState<Errors>({});
    const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
    const [powChallenge, setPowChallenge] = useState<PowChallenge | null>(null);
    const [powStatus, setPowStatus] = useState<PowStatus>('idle');
    const [processing, setProcessing] = useState(false);
    const [formError, setFormError] = useState('');
    const [doneEmail, setDoneEmail] = useState('');
    const [mailSent, setMailSent] = useState(true);
    const panel = useRef<HTMLDivElement>(null);
    const emailAbort = useRef<AbortController | null>(null);
    const powRunId = useRef(0);

    const set = (key: keyof typeof values) => (v: string) => {
        setValues((s) => ({ ...s, [key]: v }));
        setErrors((e) => ({
            ...e,
            [key]: HTML_TAG_PATTERN.test(v) ? HTML_TAG_MESSAGE : undefined,
        }));
    };
    const field = (key: keyof typeof values) => ({
        value: values[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            set(key)(e.target.value),
    });

    // Fokus ke field pertama tiap tahap.
    useEffect(() => {
        panel.current
            ?.querySelector<HTMLElement>(
                'input:not([type=hidden]), button[role=combobox]',
            )
            ?.focus();
    }, [step]);

    const loadCaptcha = useCallback(async (): Promise<PowChallenge | null> => {
        powRunId.current += 1;
        setPowStatus('idle');
        setValues((s) => ({ ...s, captcha_answer: '' }));

        const [code, body] = await xhr<Partial<PowChallenge>>(
            captcha.url(),
        ).catch(() => [0, {}] as [number, Partial<PowChallenge>]);

        if (
            code === 200 &&
            body.salt &&
            body.challenge &&
            typeof body.max === 'number'
        ) {
            const next = {
                salt: body.salt,
                challenge: body.challenge,
                max: body.max,
            };
            setPowChallenge(next);

            return next;
        }

        setPowChallenge(null);
        setPowStatus('error');

        return null;
    }, []);

    const verifyHuman = useCallback(async () => {
        if (powStatus === 'solving' || powStatus === 'verified') {
            return;
        }

        setErrors((e) => ({ ...e, captcha_answer: undefined }));
        setPowStatus('solving');

        const activeChallenge = powChallenge ?? (await loadCaptcha());

        if (!activeChallenge) {
            setPowStatus('error');

            return;
        }

        setPowStatus('solving');
        const runId = ++powRunId.current;
        const startedAt = performance.now();
        const { salt, challenge, max } = activeChallenge;

        let cursor = 0;
        const chunkSize = 2500;

        const stepSolve = () => {
            if (powRunId.current !== runId) {
                return;
            }

            const limit = Math.min(cursor + chunkSize, max + 1);
            for (let n = cursor; n < limit; n++) {
                if (sha256Hex(`${salt}:${n}`) === challenge) {
                    const elapsed = performance.now() - startedAt;
                    const delay = Math.max(0, 280 - elapsed);
                    setTimeout(() => {
                        if (powRunId.current === runId) {
                            setValues((s) => ({
                                ...s,
                                captcha_answer: String(n),
                            }));
                            setPowStatus('verified');
                        }
                    }, delay);

                    return;
                }
            }

            cursor = limit;
            if (cursor <= max) {
                setTimeout(stepSolve, 0);
            } else {
                setPowStatus('error');
            }
        };

        setTimeout(stepSolve, 16);
    }, [powStatus, powChallenge, loadCaptcha]);

    useEffect(() => {
        void loadCaptcha();
    }, [loadCaptcha]);

    const runEmailCheck = useCallback(async (email: string) => {
        emailAbort.current?.abort();

        if (!email) {
            setEmailStatus('idle');

            return;
        }

        const ctrl = new AbortController();
        emailAbort.current = ctrl;
        setEmailStatus('checking');

        try {
            const [code, body] = await xhr<{ status?: EmailStatus }>(
                checkEmail.url(),
                {
                    method: 'POST',
                    body: { email },
                    signal: ctrl.signal,
                },
            );
            setEmailStatus(code === 200 && body.status ? body.status : 'error');
        } catch {
            if (!ctrl.signal.aborted) {
                setEmailStatus('error');
            }
        }
    }, []);

    // Debounce setelah format valid; blur memicu langsung.
    useEffect(() => {
        const email = values.email.trim();

        if (HTML_TAG_PATTERN.test(email) || !EMAIL_FORMAT.test(email)) {
            emailAbort.current?.abort();
            setEmailStatus(email ? 'invalid' : 'idle');

            return;
        }

        setEmailStatus('checking');
        const t = setTimeout(() => void runEmailCheck(email), 500);

        return () => clearTimeout(t);
    }, [values.email, runEmailCheck]);

    const hasStepOneHtml =
        HTML_TAG_PATTERN.test(values.name) ||
        HTML_TAG_PATTERN.test(values.company) ||
        HTML_TAG_PATTERN.test(values.position);

    const stepOneMissing = [
        !values.name.trim() && 'nama lengkap',
        values.company.trim().length < 2 && 'perusahaan',
        !values.position.trim() && 'jabatan',
        !values.captcha_answer.trim() && 'verifikasi keamanan',
    ].filter(Boolean) as string[];

    const passwordsMatch =
        values.password !== '' &&
        values.password === values.password_confirmation;
    const canSubmit =
        !hasStepOneHtml &&
        !HTML_TAG_PATTERN.test(values.email) &&
        !HTML_TAG_PATTERN.test(values.password) &&
        !HTML_TAG_PATTERN.test(values.password_confirmation) &&
        emailStatus === 'ok' &&
        isPasswordValid(values.password) &&
        passwordsMatch &&
        values.captcha_answer.trim() !== '' &&
        !processing;

    const submit = async (e: FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            if (stepOneMissing.length > 0 || hasStepOneHtml) {
                const stepErrors: Errors = {};
                if (!values.name.trim()) {
                    stepErrors.name = 'Nama lengkap wajib diisi.';
                } else if (HTML_TAG_PATTERN.test(values.name)) {
                    stepErrors.name = HTML_TAG_MESSAGE;
                }
                if (!values.company.trim()) {
                    stepErrors.company = 'Nama perusahaan wajib diisi.';
                } else if (values.company.trim().length < 2) {
                    stepErrors.company = 'Nama perusahaan minimal 2 karakter.';
                } else if (HTML_TAG_PATTERN.test(values.company)) {
                    stepErrors.company = HTML_TAG_MESSAGE;
                }
                if (!values.position.trim()) {
                    stepErrors.position = 'Jabatan wajib diisi.';
                } else if (HTML_TAG_PATTERN.test(values.position)) {
                    stepErrors.position = HTML_TAG_MESSAGE;
                }
                if (!values.captcha_answer.trim()) {
                    stepErrors.captcha_answer =
                        'Centang verifikasi keamanan terlebih dahulu.';
                }
                setErrors((prev) => ({ ...prev, ...stepErrors }));

                return;
            }

            setStep(2);

            return;
        }

        if (!canSubmit) {
            return;
        }

        setProcessing(true);
        setFormError('');
        setErrors({});

        try {
            const [code, body] = await xhr<{
                email?: string;
                mail_sent?: boolean;
                errors?: Record<string, string[]>;
                message?: string;
            }>(store.url(), {
                method: 'POST',
                body: { ...values, email: values.email.trim() },
            });

            if (code === 201) {
                setDoneEmail(body.email ?? values.email.trim());
                setMailSent(body.mail_sent ?? true);
                setValues((s) => ({
                    ...s,
                    password: '',
                    password_confirmation: '',
                    captcha_answer: '',
                }));
                setStep(3);
            } else if (code === 422 && body.errors) {
                const next: Errors = Object.fromEntries(
                    Object.entries(body.errors).map(([k, v]) => [k, v[0]]),
                );
                setErrors(next);

                if (next.captcha_answer) {
                    void loadCaptcha();
                }

                // Error milik tahap 1: pindah ke sana dan fokus ke field pertama yang salah.
                const first = STEP_ONE_FIELDS.find((k) => next[k]);

                if (first) {
                    setStep(1);
                    setTimeout(
                        () => document.getElementById(first)?.focus(),
                        50,
                    );
                } else {
                    const target = [
                        'email',
                        'password',
                        'password_confirmation',
                    ].find((k) => next[k]);
                    setTimeout(
                        () =>
                            document.getElementById(target ?? 'email')?.focus(),
                        0,
                    );
                }

                if (next.email) {
                    void runEmailCheck(values.email.trim());
                }
            } else if (code === 429) {
                setFormError(
                    'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
                );
            } else {
                setFormError(
                    'Pendaftaran gagal. Muat ulang halaman lalu coba lagi.',
                );
            }
        } catch {
            setFormError(
                'Koneksi bermasalah. Periksa jaringan Anda lalu coba lagi.',
            );
        } finally {
            setProcessing(false);
        }
    };

    const block = (e: ClipboardEvent | React.DragEvent | React.MouseEvent) =>
        e.preventDefault();
    const emailMessage =
        errors.email ??
        (emailStatus in emailMessages ? emailMessages[emailStatus] : undefined);

    return (
        <>
            <Head title="Daftar" />

            <div className="grid gap-6">
                <h1 className="sr-only">Buat akun</h1>
                <RegisterStepper current={step} />

                {step === 3 ? (
                    <AuthCard>
                        <RegisterSuccess
                            email={doneEmail}
                            mailSent={mailSent}
                        />
                    </AuthCard>
                ) : (
                    <form
                        onSubmit={submit}
                        noValidate
                        className="grid gap-5"
                        autoComplete="on"
                    >
                        <AuthCard>
                            <div
                                key={step}
                                ref={panel}
                                className={cn(
                                    'grid animate-in gap-5 duration-300 fade-in-0 slide-in-from-right-2 motion-reduce:animate-none',
                                )}
                            >
                                {/* Honeypot: disembunyikan dari pengguna & pembaca layar; bot yang mengisinya ditolak server. */}
                                <div
                                    aria-hidden="true"
                                    className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                                >
                                    <label>
                                        Website
                                        <input
                                            type="text"
                                            name="website"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={values.website}
                                            onChange={(e) =>
                                                set('website')(e.target.value)
                                            }
                                        />
                                    </label>
                                </div>

                                {step === 1 ? (
                                    <>
                                        <FormField
                                            id="name"
                                            label="Nama lengkap"
                                            error={errors.name}
                                            required
                                        >
                                            <Input
                                                id="name"
                                                icon={User}
                                                required
                                                maxLength={255}
                                                autoComplete="name"
                                                placeholder="Masukkan nama lengkap Anda"
                                                aria-invalid={!!errors.name}
                                                aria-describedby="name-error"
                                                {...field('name')}
                                            />
                                        </FormField>

                                        <CompanyCombobox
                                            id="company"
                                            value={values.company}
                                            onChange={set('company')}
                                            error={errors.company}
                                            initialSuggestions={companies}
                                            placeholder="Cari atau pilih perusahaan Anda"
                                            description="Pilih dari daftar perusahaan yang terdaftar atau ketik untuk mendaftarkan perusahaan baru."
                                            required
                                        />

                                        <FormField
                                            id="position"
                                            label="Jabatan"
                                            error={errors.position}
                                            required
                                        >
                                            <Input
                                                id="position"
                                                icon={Briefcase}
                                                required
                                                maxLength={100}
                                                autoComplete="organization-title"
                                                placeholder="Contoh: Manajer HR"
                                                aria-invalid={!!errors.position}
                                                aria-describedby="position-error"
                                                {...field('position')}
                                            />
                                        </FormField>

                                        <FormField
                                            id="captcha_answer"
                                            label="Verifikasi keamanan"
                                            error={errors.captcha_answer}
                                            required
                                        >
                                            <div className="flex items-center gap-2">
                                                <button
                                                    id="captcha_answer"
                                                    type="button"
                                                    role="checkbox"
                                                    aria-checked={
                                                        powStatus === 'verified'
                                                    }
                                                    aria-busy={
                                                        powStatus === 'solving'
                                                    }
                                                    aria-invalid={
                                                        !!errors.captcha_answer
                                                    }
                                                    aria-describedby="captcha_answer-error"
                                                    disabled={
                                                        powStatus ===
                                                            'solving' ||
                                                        powStatus === 'verified'
                                                    }
                                                    onClick={() =>
                                                        void verifyHuman()
                                                    }
                                                    className={cn(
                                                        'flex min-h-11 flex-1 items-center justify-between gap-3 rounded-md border bg-background px-3.5 py-2.5 text-left text-sm transition-colors pointer-coarse:min-h-touch focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                                        powStatus === 'verified'
                                                            ? 'border-success/50 bg-success/5'
                                                            : errors.captcha_answer ||
                                                                powStatus ===
                                                                    'error'
                                                              ? 'border-destructive'
                                                              : 'border-input hover:bg-accent/40',
                                                    )}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span
                                                            aria-hidden="true"
                                                            className={cn(
                                                                'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                                                                powStatus ===
                                                                    'verified'
                                                                    ? 'border-success bg-success text-white'
                                                                    : powStatus ===
                                                                        'solving'
                                                                      ? 'border-primary/60 bg-primary/10 text-primary'
                                                                      : 'border-muted-foreground/50 bg-background',
                                                            )}
                                                        >
                                                            {powStatus ===
                                                                'solving' && (
                                                                <Loader2 className="size-3.5 animate-spin" />
                                                            )}
                                                            {powStatus ===
                                                                'verified' && (
                                                                <Check className="size-3.5 stroke-[3]" />
                                                            )}
                                                        </span>
                                                        <span className="font-medium text-foreground">
                                                            {powStatus ===
                                                            'solving'
                                                                ? 'Memverifikasi perangkat…'
                                                                : powStatus ===
                                                                    'verified'
                                                                  ? 'Terverifikasi bukan robot'
                                                                  : powStatus ===
                                                                      'error'
                                                                    ? 'Gagal memuat tantangan, klik untuk ulangi'
                                                                    : 'Saya bukan robot'}
                                                        </span>
                                                    </span>
                                                    <ShieldCheck
                                                        aria-hidden="true"
                                                        className={cn(
                                                            'size-4 shrink-0 transition-colors',
                                                            powStatus ===
                                                                'verified'
                                                                ? 'text-success'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    />
                                                </button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Ulangi verifikasi keamanan"
                                                    className="pointer-coarse:size-touch"
                                                    onClick={() =>
                                                        void loadCaptcha()
                                                    }
                                                >
                                                    <RefreshCw aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </FormField>
                                    </>
                                ) : (
                                    <>
                                        <FormField
                                            id="email"
                                            label="Email"
                                            error={emailMessage}
                                            required
                                        >
                                            <Input
                                                id="email"
                                                type="email"
                                                inputMode="email"
                                                icon={Mail}
                                                required
                                                maxLength={255}
                                                autoComplete="email"
                                                placeholder="nama@perusahaan.com"
                                                aria-invalid={!!emailMessage}
                                                aria-describedby="email-error"
                                                onBlur={() =>
                                                    !HTML_TAG_PATTERN.test(
                                                        values.email.trim(),
                                                    ) &&
                                                    EMAIL_FORMAT.test(
                                                        values.email.trim(),
                                                    ) &&
                                                    void runEmailCheck(
                                                        values.email.trim(),
                                                    )
                                                }
                                                {...field('email')}
                                            />
                                            {emailStatus === 'checking' && (
                                                <p
                                                    className="text-xs text-muted-foreground"
                                                    role="status"
                                                >
                                                    Memeriksa email…
                                                </p>
                                            )}
                                            {emailStatus === 'taken' && (
                                                <p className="text-sm">
                                                    <TextLink href={login()}>
                                                        Masuk dengan email ini
                                                    </TextLink>
                                                </p>
                                            )}
                                        </FormField>

                                        <FormField
                                            id="password"
                                            label="Password"
                                            error={errors.password}
                                            required
                                        >
                                            <PasswordInput
                                                id="password"
                                                icon={Lock}
                                                required
                                                autoComplete="new-password"
                                                placeholder="Minimal 8 karakter"
                                                aria-invalid={!!errors.password}
                                                aria-describedby="password-error"
                                                {...field('password')}
                                            />
                                            <PasswordStrength
                                                value={values.password}
                                            />
                                        </FormField>

                                        <FormField
                                            id="password_confirmation"
                                            label="Konfirmasi password"
                                            error={errors.password_confirmation}
                                            required
                                        >
                                            <PasswordInput
                                                id="password_confirmation"
                                                icon={Lock}
                                                required
                                                autoComplete="off"
                                                placeholder="Ulangi password Anda"
                                                onPaste={block}
                                                onDrop={block}
                                                onContextMenu={block}
                                                aria-invalid={
                                                    !!errors.password_confirmation
                                                }
                                                aria-describedby="password_confirmation-error"
                                                {...field(
                                                    'password_confirmation',
                                                )}
                                            />
                                            {values.password_confirmation && (
                                                <p
                                                    role="status"
                                                    className={cn(
                                                        'text-xs',
                                                        passwordsMatch
                                                            ? 'text-success'
                                                            : 'text-destructive',
                                                    )}
                                                >
                                                    {passwordsMatch
                                                        ? 'Password cocok.'
                                                        : 'Password belum cocok.'}
                                                </p>
                                            )}
                                        </FormField>

                                        {formError && (
                                            <p
                                                role="alert"
                                                className="text-sm text-destructive"
                                            >
                                                {formError}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </AuthCard>

                        {step === 1 ? (
                            <div className="grid gap-2">
                                <Button
                                    type="submit"
                                    className="w-full pointer-coarse:h-touch"
                                    icon={ArrowRight}
                                    disabled={
                                        stepOneMissing.length > 0 ||
                                        hasStepOneHtml
                                    }
                                >
                                    Lanjut
                                </Button>
                                {stepOneMissing.length > 0 && (
                                    <p className="text-center text-xs text-muted-foreground">
                                        Lengkapi {stepOneMissing.join(', ')}{' '}
                                        untuk melanjutkan.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-[auto_1fr] gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="pointer-coarse:h-touch"
                                        icon={ArrowLeft}
                                        onClick={() => setStep(1)}
                                    >
                                        Kembali
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="pointer-coarse:h-touch"
                                        loading={processing}
                                        icon={UserPlus}
                                        disabled={!canSubmit}
                                        data-test="register-user-button"
                                    >
                                        {processing ? 'Memproses...' : 'Daftar'}
                                    </Button>
                                </div>
                                <p className="text-center text-xs text-muted-foreground">
                                    Setelah mendaftar, tautan verifikasi akan
                                    dikirim ke email Anda.
                                </p>
                            </>
                        )}
                    </form>
                )}
            </div>
        </>
    );
}

Register.layout = {
    card: false,
};
