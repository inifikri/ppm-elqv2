import { Head, router } from "@inertiajs/react";
import { ArrowRight, Loader2, LogIn, Lock, Mail } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import InputError from "@/components/input-error";
import TextLink from "@/components/text-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PasswordInput from "@/components/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useInitials } from "@/hooks/use-initials";
import { register } from "@/routes";
import { identify, store } from "@/routes/login";
import { request } from "@/routes/password";

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
    name?: string;
    role?: string;
    redirect?: string;
};

const LOCK_SECONDS = 30;

async function post(url: string, body: object): Promise<[number, LoginResult]> {
    const token = decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? "",
    );
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": token,
            "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(body),
    });

    return [res.status, await res.json().catch(() => ({}))];
}

export default function Login({ status, canResetPassword }: Props) {
    const getInitials = useInitials();
    const [step, setStep] = useState<"email" | "password">("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");
    const [remember, setRemember] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
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
        (step === "email" ? emailRef : passwordRef).current?.focus();
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
        setError("");
        setNotRegistered(false);

        try {
            const [code, r] = await post(identify.url(), { email });

            if (code === 429) {
                setError("Terlalu banyak permintaan. Coba lagi sebentar lagi.");
            } else if (code === 422) {
                setError("Format email tidak valid.");
            } else if (r.registered) {
                setUserName(r.name || "");
                setUserRole(r.role || "Peserta Assessment");
                setAttemptsLeft(null);
                setResetRequired(false);
                setSeconds(0);
                applyBlock(r);
                setStep("password");
            } else {
                setNotRegistered(true);
            }
        } catch {
            setError("Koneksi gagal. Periksa jaringan Anda lalu coba lagi.");
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
        setError("");

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

            setPassword("");
            setError(r.message ?? "Terjadi kesalahan. Coba lagi.");
            setAttemptsLeft(r.attempts_left ?? null);
            applyBlock(r);
            passwordRef.current?.focus();
        } catch {
            setError("Koneksi gagal. Periksa jaringan Anda lalu coba lagi.");
        } finally {
            setProcessing(false);
        }
    };

    const changeEmail = () => {
        setPassword("");
        setError("");
        setUserName("");
        setUserRole("");
        setStep("email");
    };

    const locked = seconds > 0;
    const announce = seconds > 0 && (seconds % 5 === 0 || seconds === total);

    return (
        <>
            <Head title="Masuk" />

            {step === "email" ? (
                <form onSubmit={submitEmail} className="grid gap-5" noValidate>
                    <AuthCard className="p-6 sm:p-7 space-y-6">
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-bold tracking-tight text-foreground">
                                Selamat Datang Kembali
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Masuk untuk melanjutkan ke akun ELQ 360° Anda
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-xs font-semibold text-foreground"
                            >
                                Alamat Email
                            </Label>
                            <div className="flex items-center gap-2.5">
                                <div className="relative flex-1">
                                    <Input
                                        ref={emailRef}
                                        id="email"
                                        icon={Mail}
                                        type="email"
                                        inputMode="email"
                                        autoComplete="username"
                                        placeholder="nama@perusahaan.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                        aria-invalid={!!error || notRegistered}
                                        aria-describedby="email-msg"
                                        className="h-12 text-sm bg-background/50 focus:bg-background"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="group relative size-12 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-75 flex items-center justify-center cursor-pointer overflow-hidden"
                                    disabled={!email || processing}
                                    aria-label={
                                        processing
                                            ? "Memeriksa email..."
                                            : "Lanjut ke pengisian password"
                                    }
                                    title={
                                        processing
                                            ? "Memeriksa email..."
                                            : "Lanjut"
                                    }
                                    data-test="email-next-button"
                                >
                                    {processing && (
                                        <span
                                            className="absolute inset-0 rounded-full bg-primary-foreground/20 animate-ping pointer-events-none"
                                            aria-hidden="true"
                                        />
                                    )}
                                    <span className="relative flex items-center justify-center">
                                        {processing ? (
                                            <Loader2
                                                className="size-5 animate-spin text-primary-foreground"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <ArrowRight
                                                className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </span>
                                </Button>
                            </div>
                            <div id="email-msg" aria-live="polite">
                                <InputError message={error} />
                                {notRegistered && (
                                    <p className="text-xs text-destructive mt-1">
                                        Email belum terdaftar.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-1 text-center text-xs text-muted-foreground">
                            Belum punya akun?{" "}
                            <TextLink
                                href={register()}
                                className="font-semibold text-primary underline-offset-4 hover:underline"
                            >
                                Buat Akun
                            </TextLink>
                        </div>
                    </AuthCard>
                </form>
            ) : (
                <form
                    onSubmit={submitPassword}
                    className="grid gap-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2"
                    noValidate
                >
                    <AuthCard className="p-6 sm:p-7 space-y-6">
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-bold tracking-tight text-foreground">
                                Konfirmasi Identitas
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Silakan masukkan password untuk melanjutkan
                            </p>
                        </div>

                        {/* User Profile Card (Nama Profile, email, role) */}
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="size-11 rounded-full border border-primary/30 bg-primary/10 text-primary shrink-0 shadow-xs">
                                    <AvatarFallback className="rounded-full bg-primary/10 text-primary font-bold text-sm">
                                        {getInitials(userName || email)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 space-y-0.5">
                                    <div className="font-bold text-foreground text-sm truncate leading-tight">
                                        {userName || "Pengguna"}
                                    </div>
                                    <div
                                        className="text-xs text-muted-foreground truncate"
                                        title={email}
                                    >
                                        {email}
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px] px-2 py-0 font-medium bg-primary/15 text-primary border border-primary/25 mt-1"
                                    >
                                        {userRole || "Peserta Assessment"}
                                    </Badge>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={changeEmail}
                                className="text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                                title="Ganti akun email"
                            >
                                Ganti
                            </Button>
                        </div>

                        {resetRequired ? (
                            <div
                                role="alert"
                                className="grid gap-3 rounded-card border border-destructive/30 bg-destructive-subtle p-4 text-sm"
                            >
                                <p className="font-medium">
                                    Percobaan login gagal berulang.
                                </p>
                                <p className="text-xs text-muted-foreground">
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
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="password"
                                            className="text-xs font-semibold text-foreground"
                                        >
                                            Password
                                        </Label>
                                        {canResetPassword && (
                                            <TextLink
                                                href={request({
                                                    query: { email },
                                                })}
                                                className="text-xs text-primary hover:underline"
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
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                        disabled={locked}
                                        aria-invalid={!!error && !locked}
                                        aria-describedby="password-msg"
                                        className="h-11 text-sm bg-background/50 focus:bg-background"
                                    />
                                    <div id="password-msg" aria-live="polite">
                                        {!locked && (
                                            <InputError message={error} />
                                        )}
                                        {!locked && attemptsLeft !== null && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                Sisa {attemptsLeft} kesempatan
                                                percobaan.
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
                                        className="text-xs font-normal text-muted-foreground cursor-pointer"
                                    >
                                        Ingat saya di perangkat ini
                                    </Label>
                                </div>

                                {locked && (
                                    <div
                                        className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200"
                                        role="status"
                                    >
                                        <Progress
                                            value={(seconds / total) * 100}
                                            className="h-1.5"
                                            aria-hidden
                                        />
                                        <p className="text-xs">
                                            Terlalu banyak percobaan gagal.
                                            Silakan coba lagi dalam{" "}
                                            <strong>{seconds} detik</strong>.
                                        </p>
                                        <span
                                            className="sr-only"
                                            aria-live="polite"
                                        >
                                            {announce
                                                ? `Coba lagi dalam ${seconds} detik`
                                                : ""}
                                        </span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-sm font-semibold pointer-coarse:h-touch"
                                    loading={processing}
                                    disabled={locked || !password}
                                    icon={LogIn}
                                    data-test="login-button"
                                >
                                    {processing
                                        ? "Memverifikasi..."
                                        : "Masuk ke Sistem"}
                                </Button>
                            </>
                        )}
                    </AuthCard>
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
