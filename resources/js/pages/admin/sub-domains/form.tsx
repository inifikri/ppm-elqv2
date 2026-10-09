import { Head } from '@inertiajs/react';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { fieldA11y, MasterForm } from '@/components/master-form';
import { SelectField } from '@/components/select-field';
import { Input } from '@/components/ui/input';
import { index, store, update } from '@/routes/admin/sub-domains';
import type { DomainOption, SubDomain } from '@/types';

export default function SubDomainForm({
    subDomain,
    domains,
    defaultDomainId,
}: {
    subDomain: SubDomain | null;
    domains: DomainOption[];
    defaultDomainId: number | null;
}) {
    const title = subDomain ? 'Ubah sub dimensi' : 'Tambah sub dimensi';

    return (
        <>
            <Head title={title} />
            <MasterForm
                title={title}
                form={subDomain ? update.form(subDomain.id) : store.form()}
                cancelHref={index()}
                resettable={subDomain !== null}
            >
                {(errors) => (
                    <FormCard title="Data Sub Dimensi">
                        <SelectField
                            id="dimension_id"
                            name="dimension_id"
                            label="Dimensi"
                            placeholder="Pilih dimensi"
                            options={domains.map((d) => ({
                                value: d.id,
                                label: d.name,
                            }))}
                            defaultValue={
                                subDomain?.dimension_id ?? defaultDomainId
                            }
                            error={errors.dimension_id}
                        />
                        <FormField
                            id="name"
                            label="Nama"
                            error={errors.name}
                            required
                        >
                            <Input
                                {...fieldA11y('name', errors.name)}
                                name="name"
                                required
                                defaultValue={subDomain?.name}
                            />
                        </FormField>
                        <FormField
                            id="sort_order"
                            label="Urutan"
                            description="Kosongkan untuk menaruh di akhir."
                            error={errors.sort_order}
                        >
                            <Input
                                {...fieldA11y('sort_order', errors.sort_order)}
                                type="number"
                                min={0}
                                name="sort_order"
                                defaultValue={subDomain?.sort_order}
                            />
                        </FormField>
                    </FormCard>
                )}
            </MasterForm>
        </>
    );
}

SubDomainForm.layout = {
    breadcrumbs: [{ title: 'Sub Dimensi', href: index() }],
};
