import { Head, router } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    Mail,
    Phone,
    Shield,
    User,
    UserCheck,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { BackButton } from '@/components/back-button';
import { PasswordStrength } from '@/components/auth/password-strength';
import { CompanyCombobox } from '@/components/company-combobox';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { FormFooter } from '@/components/form-footer';
import PasswordInput from '@/components/password-input';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { UnsavedChangesGuard } from '@/components/unsaved-changes-guard';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    index as participantsIndex,
    store as storeParticipant,
} from '@/routes/admin/participants';

export default function CreateParticipant({
    companies,
}: {
    companies: string[];
}) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [position, setPosition] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const [bossEmail, setBossEmail] = useState('');
    const [subordinates, setSubordinates] = useState<[string, string, string]>([
        '',
        '',
        '',
    ]);

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);

    const updateSubordinate = (index: 0 | 1 | 2, val: string) => {
        setIsDirty(true);
        setSubordinates((prev) => {
            const next: [string, string, string] = [...prev];
            next[index] = val;
            return next;
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(
            storeParticipant.url(),
            {
                name,
                email,
                phone: phone || null,
                company_name: companyName,
                position,
                password,
                password_confirmation: passwordConfirmation,
                boss_email: bossEmail,
                subordinate_emails: subordinates,
            },
            {
                onError: (errs) => {
                    setErrors(errs);
                    setProcessing(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <PageContainer narrow>
            <Head title="Tambah Peserta" />
            <BackButton href={participantsIndex.url()} />
            <PageHeader
                title="Tambah Peserta"
                description="Pendaftaran akun peserta baru dan 4 penilai (1 atasan & 3 bawahan)"
            />

            <UnsavedChangesGuard dirty={isDirty} />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Card 1: Profil Peserta */}
                <FormCard
                    title="Profil Peserta"
                    description="Identitas akun, kredensial masuk, dan jabatan peserta."
                >
                    <FormField
                        id="name"
                        label="Nama lengkap peserta"
                        error={errors.name}
                        required
                    >
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setIsDirty(true);
                            }}
                            required
                            placeholder="Contoh: Budi Pratama"
                            autoComplete="name"
                        />
                    </FormField>

                    <FormField
                        id="email"
                        label="Email peserta"
                        error={errors.email}
                        required
                    >
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setIsDirty(true);
                            }}
                            required
                            placeholder="peserta@perusahaan.com"
                            autoComplete="email"
                        />
                    </FormField>

                    <FormField
                        id="phone"
                        label="Nomor telepon"
                        error={errors.phone}
                    >
                        <Input
                            id="phone"
                            name="phone"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                setIsDirty(true);
                            }}
                            placeholder="08123456789"
                            autoComplete="tel"
                        />
                    </FormField>

                    <CompanyCombobox
                        id="company_name"
                        value={companyName}
                        onChange={(val) => {
                            setCompanyName(val);
                            setIsDirty(true);
                        }}
                        error={errors.company_name}
                        initialSuggestions={companies}
                        placeholder="Ketik atau pilih perusahaan"
                        required
                    />

                    <FormField
                        id="position"
                        label="Jabatan"
                        error={errors.position}
                        required
                        className="sm:col-span-2"
                    >
                        <Input
                            id="position"
                            name="position"
                            value={position}
                            onChange={(e) => {
                                setPosition(e.target.value);
                                setIsDirty(true);
                            }}
                            required
                            placeholder="Contoh: General Manager Operational"
                        />
                    </FormField>

                    <FormField
                        id="password"
                        label="Password akun"
                        error={errors.password}
                        required
                        className="sm:col-span-2"
                    >
                        <PasswordInput
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setIsDirty(true);
                            }}
                            required
                            autoComplete="new-password"
                            placeholder="Minimal 8 karakter"
                        />
                        <div className="mt-2.5">
                            <PasswordStrength value={password} />
                        </div>
                    </FormField>

                    <FormField
                        id="password_confirmation"
                        label="Konfirmasi password"
                        error={errors.password_confirmation}
                        required
                        className="sm:col-span-2"
                    >
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            value={passwordConfirmation}
                            onChange={(e) => {
                                setPasswordConfirmation(e.target.value);
                                setIsDirty(true);
                            }}
                            required
                            autoComplete="new-password"
                            placeholder="Ketik ulang password"
                        />
                        {passwordConfirmation && (
                            <p
                                role="status"
                                className={cn(
                                    'mt-1.5 text-xs font-medium',
                                    password === passwordConfirmation
                                        ? 'text-success'
                                        : 'text-destructive',
                                )}
                            >
                                {password === passwordConfirmation
                                    ? 'Password cocok.'
                                    : 'Password belum cocok.'}
                            </p>
                        )}
                    </FormField>
                </FormCard>

                {/* Card 2: Penilai Atasan */}
                <FormCard
                    title="Penilai Atasan (Boss)"
                    description="1 orang atasan langsung yang akan mengevaluasi kepemimpinan peserta."
                >
                    <FormField
                        id="boss_email"
                        label="Email atasan"
                        error={errors.boss_email}
                        required
                        className="sm:col-span-2"
                        description="Tautan undangan kuesioner akan otomatis dikirimkan ke alamat email ini."
                    >
                        <Input
                            id="boss_email"
                            type="email"
                            name="boss_email"
                            value={bossEmail}
                            onChange={(e) => {
                                setBossEmail(e.target.value);
                                setIsDirty(true);
                            }}
                            required
                            placeholder="atasan@perusahaan.com"
                        />
                    </FormField>
                </FormCard>

                {/* Card 3: Penilai Bawahan */}
                <FormCard
                    title="Penilai Bawahan (Subordinates)"
                    description="3 orang bawahan langsung untuk penilaian kepemimpinan 360°."
                >
                    <FormField
                        id="subordinate_0"
                        label="Email bawahan 1"
                        error={
                            errors['subordinate_emails.0'] ??
                            errors.subordinate_emails
                        }
                        required
                        className="sm:col-span-2"
                    >
                        <Input
                            id="subordinate_0"
                            type="email"
                            value={subordinates[0]}
                            onChange={(e) =>
                                updateSubordinate(0, e.target.value)
                            }
                            required
                            placeholder="bawahan1@perusahaan.com"
                        />
                    </FormField>

                    <FormField
                        id="subordinate_1"
                        label="Email bawahan 2"
                        error={errors['subordinate_emails.1']}
                        required
                        className="sm:col-span-2"
                    >
                        <Input
                            id="subordinate_1"
                            type="email"
                            value={subordinates[1]}
                            onChange={(e) =>
                                updateSubordinate(1, e.target.value)
                            }
                            required
                            placeholder="bawahan2@perusahaan.com"
                        />
                    </FormField>

                    <FormField
                        id="subordinate_2"
                        label="Email bawahan 3"
                        error={errors['subordinate_emails.2']}
                        required
                        className="sm:col-span-2"
                    >
                        <Input
                            id="subordinate_2"
                            type="email"
                            value={subordinates[2]}
                            onChange={(e) =>
                                updateSubordinate(2, e.target.value)
                            }
                            required
                            placeholder="bawahan3@perusahaan.com"
                        />
                    </FormField>
                </FormCard>

                <FormFooter
                    processing={processing}
                    cancelHref="/admin/participants"
                />
            </form>
        </PageContainer>
    );
}
