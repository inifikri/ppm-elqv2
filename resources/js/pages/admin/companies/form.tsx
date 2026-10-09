import { Head } from '@inertiajs/react';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { fieldA11y, MasterForm } from '@/components/master-form';
import { Input } from '@/components/ui/input';
import { index, store, update } from '@/routes/admin/companies';
import type { Company } from '@/types';

export default function CompanyForm({ company }: { company: Company | null }) {
    const title = company ? 'Ubah perusahaan' : 'Tambah perusahaan';

    return (
        <>
            <Head title={title} />
            <MasterForm
                title={title}
                form={company ? update.form(company.id) : store.form()}
                cancelHref={index()}
                resettable={company !== null}
            >
                {(errors) => (
                    <FormCard title="Data Perusahaan">
                        <FormField
                            id="name"
                            label="Nama"
                            error={errors.name}
                            required
                            className="sm:col-span-2"
                        >
                            <Input
                                {...fieldA11y('name', errors.name)}
                                name="name"
                                required
                                defaultValue={company?.name}
                            />
                        </FormField>
                    </FormCard>
                )}
            </MasterForm>
        </>
    );
}

CompanyForm.layout = {
    breadcrumbs: [{ title: 'Perusahaan', href: index() }],
};
