import { Head } from '@inertiajs/react';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { fieldA11y, MasterForm } from '@/components/master-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { index, store, update } from '@/routes/admin/domains';
import type { Domain } from '@/types';

export default function DomainForm({ domain }: { domain: Domain | null }) {
    const title = domain ? 'Ubah dimensi' : 'Tambah dimensi';

    return (
        <>
            <Head title={title} />
            <MasterForm
                title={title}
                form={domain ? update.form(domain.id) : store.form()}
                cancelHref={index()}
                resettable={domain !== null}
            >
                {(errors) => (
                    <FormCard title="Data Dimensi">
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
                                defaultValue={domain?.name}
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
                                defaultValue={domain?.sort_order}
                            />
                        </FormField>
                        <div className="flex items-center gap-3 sm:col-span-2">
                            <input type="hidden" name="is_active" value="0" />
                            <Switch
                                id="is_active"
                                name="is_active"
                                value="1"
                                defaultChecked={domain?.is_active ?? true}
                            />
                            <Label htmlFor="is_active">Dimensi aktif</Label>
                        </div>
                    </FormCard>
                )}
            </MasterForm>
        </>
    );
}

DomainForm.layout = {
    breadcrumbs: [{ title: 'Dimensi', href: index() }],
};
