import { Head, router } from '@inertiajs/react';
import { ArrowRight, LogIn, Lock, Mail } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import PasswordInput from '@/components/password-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { register } from '@/routes';
import { identify, store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

type LoginResult = {
    message?: string;
    attempts_left?: number;
    retry_after?: number;
    reset_required?: boolean;
    registered?: boolean;
    redirect?: string;
};

const LOCK_SECONDS = 30;

async function post(url: string, body: object): Promise<[number, LoginResult]> {
    const token = decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': token,
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(body),
    });

    return [res.status, await res.json().catch(() => ({}))];
}

export default function Login({ status, canResetPassword }: Props) {
    const [step, setStep] = useState<'email' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [notRegistered, setNotRegistered] = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [resetRequired, setResetRequired] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [total, setTotal] = useState(LOCK_SECONDS);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    // Server adalah sumber kebenaran; klien hanya menghitung mundur dari retry_after.
    useEffect(() => {
        if (seconds <= 0) {
            return;
        }

        const id = setTimeout(() => setSeconds((s) => s - 1), 1000);

        return () => clearTimeout(id);
    }, [seconds]);

    useEffect(() => {
        (step === 'email' ? emailRef : passwordRef).current?.focus();
    }, [step]);

    const applyBlock = (r: LoginResult) => {
        if (r.reset_required) {
            setResetRequired(true);
            setSeconds(0);
        } else if (r.retry_after) {
            setTotal(Math.max(r.retry_after, LOCK_SECONDS));
            setSeconds(r.retry_after);
        }
    };

    const submitEmail = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setError('');
        setNotRegistered(false);

        try {
            const [code, r] = await post(identify.url(), { email });

            if (code === 429) {
                setError('Terlalu banyak permintaan. Coba lagi sebentar lagi.');
            } else if (code === 422) {
                setError('Format email tidak valid.');
            } else if (r.registered) {
                setAttemptsLeft(null);
                setResetRequired(false);
                setSeconds(0);
                applyBlock(r);
                setStep('password');
            } else {
                setNotRegistered(true);
            }
        } catch {
            setError('Koneksi gagal. Periksa jaringan Anda lalu coba lagi.');
        } finally {
            setProcessing(false);
        }
    };

    const submitPassword = async (e: FormEvent) => {
        e.preventDefault();

        if (processing || seconds > 0 || resetRequired) {
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const [code, r] = await post(store.url(), {
                email,
                password,
                remember,
            });

            if (code === 200 && r.redirect) {
                router.visit(r.redirect);

                return;
            }

            setPassword('');
            setError(r.message ?? 'Terjadi kesalahan. Coba lagi.');
            setAttemptsLeft(r.attempts_left ?? null);
            applyBlock(r);
            passwordRef.current?.focus();
        } catch {
            setError('Koneksi gagal. Periksa jaringan Anda lalu coba lagi.');
        } finally {
            setProcessing(false);
        }
    };

    const changeEmail = () => {
        setPassword('');
        setError('');
        setStep('email');
    };

    const locked = seconds > 0;
    const announce = seconds > 0 && (seconds % 5 === 0 || seconds === total);

    return (
        <>
            <Head title="Masuk" />

            {step === 'email' ? (
                <form onSubmit={submitEmail} className="grid gap-5" noValidate>
                    <AuthCard>
                        <div className="mb-5">
                            <h1 className="text-xl font-semibold">
                                Selamat datang kembali
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Masuk untuk melanjutkan ke ELQ Assessment 360
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                ref={emailRef}
                                id="email"
                                icon={Mail}
                                type="email"
                                inputMode="email"
                                autoComplete="username"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                aria-invalid={!!error || notRegistered}
                                aria-describedby="email-msg"
                            />
                            <div id="email-msg" aria-live="polite">
                                <InputError message={error} />
                                {notRegistered && (
                                    <p className="text-sm text-destructive">
                                        Email belum terdaftar.{' '}
                                        <TextLink href={register()}>
                                            Daftar sekarang
                                        </TextLink>
                                    </p>
                                )}
                            </div>
                        </div>
                    </AuthCard>
                    <Button
                        type="submit"
                        className="w-full pointer-coarse:h-touch"
                        loading={processing}
                        disabled={!email}
                        icon={ArrowRight}
                    >
                        {processing ? 'Memproses...' : 'Lanjut'}
                    </Button>
                </form>
            ) : (
                <form
                    onSubmit={submitPassword}
                    className="grid gap-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2"
                    noValidate
                >
                    <AuthCard className="grid gap-6">
                        <div>
                            <div className="">
                                <h1 className="text-xl font-semibold">
                                    Selamat datang kembali
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Masuk untuk melanjutkan ke ELQ Assessment
                                    360
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 rounded-control border border-border bg-muted px-3 py-2 text-sm">
                            <span className="truncate" title={email}>
                                {email}
                            </span>
                            <button
                                type="button"
                                onClick={changeEmail}
                                className="shrink-0 font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                Ganti
                            </button>
                        </div>

                        {resetRequired ? (
                            <div
                                role="alert"
                                className="grid gap-3 rounded-card border border-destructive/30 bg-destructive-subtle p-4 text-sm"
                            >
                                <p className="font-medium">
                                    Percobaan login gagal berulang.
                                </p>
                                <p>
                                    Demi keamanan, silakan reset password Anda
                                    untuk melanjutkan.
                                </p>
                                <Button
                                    asChild
                                    className="pointer-coarse:h-touch"
                                >
                                    <TextLink
                                        href={request({ query: { email } })}
                                    >
                                        Reset password
                                    </TextLink>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        {canResetPassword && (
                                            <TextLink
                                                href={request({
                                                    query: { email },
                                                })}
                                                className="ml-auto text-sm"
                                            >
                                                Lupa password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <PasswordInput
                                        ref={passwordRef}
                                        id="password"
                                        icon={Lock}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                        disabled={locked}
                                        aria-invalid={!!error && !locked}
                                        aria-describedby="password-msg"
                                    />
                                    <div id="password-msg" aria-live="polite">
                                        {!locked && (
                                            <InputError message={error} />
                                        )}
                                        {!locked && attemptsLeft !== null && (
                                            <p className="text-sm text-muted-foreground">
                                                Sisa {attemptsLeft} kesempatan.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        checked={remember}
                                        onCheckedChange={(v) =>
                                            setRemember(v === true)
                                        }
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="font-normal"
                                    >
                                        Ingat saya
                                    </Label>
                                </div>

                                {locked && (
                                    <div className="grid gap-2" role="status">
                                        <Progress
                                            value={(seconds / total) * 100}
                                            className="h-1"
                                            aria-hidden
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Coba lagi dalam {seconds} detik.
                                        </p>
                                        <span
                                            className="sr-only"
                                            aria-live="polite"
                                        >
                                            {announce
                                                ? `Coba lagi dalam ${seconds} detik`
                                                : ''}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </AuthCard>
                    {!resetRequired && (
                        <Button
                            type="submit"
                            className="w-full pointer-coarse:h-touch"
                            loading={processing}
                            disabled={locked || !password}
                            icon={LogIn}
                            data-test="login-button"
                        >
                            {processing ? 'Memproses...' : 'Masuk'}
                        </Button>
                    )}
                </form>
            )}

            {status && (
                <div className="mt-4 text-center text-sm font-medium text-success">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    card: false,
};
