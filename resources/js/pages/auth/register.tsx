import { Head } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Lock,
    Mail,
    RefreshCw,
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
type Errors = Partial<Record<string, string>>;

const STEP_ONE_FIELDS = ['name', 'company', 'position'];
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailMessages: Record<string, string> = {
    invalid: 'Format email tidak valid.',
    domain_not_found:
        'Domain email tidak ditemukan. Periksa penulisan email Anda.',
    taken: 'Email ini sudah terdaftar.',
    error: 'Tidak dapat memeriksa email. Periksa koneksi Anda lalu coba lagi.',
};

export default function Register() {
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
    const [question, setQuestion] = useState('');
    const [processing, setProcessing] = useState(false);
    const [formError, setFormError] = useState('');
    const [doneEmail, setDoneEmail] = useState('');
    const panel = useRef<HTMLDivElement>(null);
    const emailAbort = useRef<AbortController | null>(null);

    const set = (key: keyof typeof values) => (v: string) => {
        setValues((s) => ({ ...s, [key]: v }));
        setErrors((e) => ({ ...e, [key]: undefined }));
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

    const loadCaptcha = useCallback(async () => {
        const [, body] = await xhr<{ question?: string }>(captcha.url()).catch(
            () => [0, {}] as [number, { question?: string }],
        );
        setQuestion(body.question ?? '');
        setValues((s) => ({ ...s, captcha_answer: '' }));
    }, []);

    useEffect(() => {
        if (step === 2) {
            void loadCaptcha();
        }
    }, [step, loadCaptcha]);

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

        if (!EMAIL_FORMAT.test(email)) {
            emailAbort.current?.abort();
            setEmailStatus(email ? 'invalid' : 'idle');

            return;
        }

        setEmailStatus('checking');
        const t = setTimeout(() => void runEmailCheck(email), 500);

        return () => clearTimeout(t);
    }, [values.email, runEmailCheck]);

    const stepOneMissing = [
        !values.name.trim() && 'nama lengkap',
        values.company.trim().length < 2 && 'perusahaan',
        !values.position.trim() && 'jabatan',
    ].filter(Boolean) as string[];

    const passwordsMatch =
        values.password !== '' &&
        values.password === values.password_confirmation;
    const canSubmit =
        emailStatus === 'ok' &&
        isPasswordValid(values.password) &&
        passwordsMatch &&
        values.captcha_answer.trim() !== '' &&
        !processing;

    const submit = async (e: FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            if (stepOneMissing.length === 0) {
                setStep(2);
            }

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
                errors?: Record<string, string[]>;
                message?: string;
            }>(store.url(), {
                method: 'POST',
                body: { ...values, email: values.email.trim() },
            });

            if (code === 201) {
                setDoneEmail(body.email ?? values.email.trim());
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
                        'captcha_answer',
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

                void loadCaptcha();
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
                        <RegisterSuccess email={doneEmail} />
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
                                                        set('website')(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </label>
                                        </div>

                                        <FormField
                                            id="captcha_answer"
                                            label={
                                                question
                                                    ? `Verifikasi: ${question}`
                                                    : 'Verifikasi'
                                            }
                                            error={errors.captcha_answer}
                                            required
                                        >
                                            <div className="flex gap-2">
                                                <Input
                                                    id="captcha_answer"
                                                    inputMode="numeric"
                                                    autoComplete="off"
                                                    maxLength={3}
                                                    placeholder="Jawaban"
                                                    aria-invalid={
                                                        !!errors.captcha_answer
                                                    }
                                                    aria-describedby="captcha_answer-error"
                                                    {...field('captcha_answer')}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Ganti soal verifikasi"
                                                    className="pointer-coarse:size-touch"
                                                    onClick={() =>
                                                        void loadCaptcha()
                                                    }
                                                >
                                                    <RefreshCw aria-hidden="true" />
                                                </Button>
                                            </div>
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
                                    disabled={stepOneMissing.length > 0}
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
