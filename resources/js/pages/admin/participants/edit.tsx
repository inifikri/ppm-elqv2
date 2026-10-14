import { Head, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { BackButton } from '@/components/back-button';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { FormFooter } from '@/components/form-footer';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { UnsavedChangesGuard } from '@/components/unsaved-changes-guard';
import { Input } from '@/components/ui/input';

export type EditParticipantProps = {
    participant: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        company_name: string;
        position: string;
        boss_email: string;
        subordinate_emails: [string, string, string];
    };
    companies: string[];
};

export default function EditParticipant({
    participant,
    companies,
}: EditParticipantProps) {
    const [name, setName] = useState(participant.name);
    const [email, setEmail] = useState(participant.email);
    const [phone, setPhone] = useState(participant.phone ?? '');
    const [companyName, setCompanyName] = useState(participant.company_name);
    const [position, setPosition] = useState(participant.position);

    const [bossEmail, setBossEmail] = useState(participant.boss_email);
    const [subordinates, setSubordinates] = useState<[string, string, string]>(
        participant.subordinate_emails,
    );

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

        router.put(
            `/admin/participants/${participant.id}`,
            {
                name,
                email,
                phone: phone || null,
                company_name: companyName,
                position,
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
            <Head title={`Edit Peserta - ${participant.name}`} />
            <BackButton href={`/admin/participants/${participant.id}`} />
            <PageHeader
                title="Edit Peserta"
                description="Perbarui informasi profil peserta dan email penilai 360°"
            />

            <UnsavedChangesGuard dirty={isDirty} />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Card 1: Profil Peserta */}
                <FormCard
                    title="Profil Peserta"
                    description="Identitas akun dan jabatan peserta."
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

                    <FormField
                        id="company_name"
                        label="Perusahaan"
                        error={errors.company_name}
                        required
                    >
                        <Input
                            id="company_name"
                            name="company_name"
                            list="company-suggestions"
                            value={companyName}
                            onChange={(e) => {
                                setCompanyName(e.target.value);
                                setIsDirty(true);
                            }}
                            required
                            placeholder="Ketik atau pilih perusahaan"
                        />
                        <datalist id="company-suggestions">
                            {companies.map((c) => (
                                <option key={c} value={c} />
                            ))}
                        </datalist>
                    </FormField>

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
                        description="Tautan kuesioner terhubung dengan alamat email ini."
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
                    cancelHref={`/admin/participants/${participant.id}`}
                    submitLabel="Simpan Perubahan"
                />
            </form>
        </PageContainer>
    );
}

EditParticipant.layout = {
    breadcrumbs: [
        { title: 'Peserta', href: '/admin/participants' },
        { title: 'Edit', href: '#' },
    ],
};
