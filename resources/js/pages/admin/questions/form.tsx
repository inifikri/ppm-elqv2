import { Head } from '@inertiajs/react';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { fieldA11y, MasterForm } from '@/components/master-form';
import { RichTextEditor } from '@/components/rich-text-editor';
import { SelectField } from '@/components/select-field';
import { Input } from '@/components/ui/input';

import { index, store, update } from '@/routes/admin/questions';
import type { QuestionRow, SubDomainOption } from '@/types';

export default function QuestionForm({
    question,
    subDomains,
    defaultSubDomainId,
}: {
    question: QuestionRow | null;
    subDomains: SubDomainOption[];
    defaultSubDomainId: number | null;
}) {
    const title = question ? 'Ubah pertanyaan' : 'Tambah pertanyaan';

    return (
        <>
            <Head title={title} />
            <MasterForm
                title={title}
                form={question ? update.form(question.id) : store.form()}
                cancelHref={index()}
                resettable={question !== null}
            >
                {(errors) => (
                    <FormCard title="Data Pertanyaan">
                        <SelectField
                            id="sub_dimension_id"
                            name="sub_dimension_id"
                            label="Sub Dimensi"
                            placeholder="Pilih sub dimensi"
                            options={subDomains.map((s) => ({
                                value: s.id,
                                label: `${s.domain} / ${s.name}`,
                            }))}
                            defaultValue={
                                question?.sub_dimension_id ?? defaultSubDomainId
                            }
                            error={errors.sub_dimension_id}
                            className="sm:col-span-2"
                        />
                        <FormField
                            id="text"
                            label="Teks pertanyaan"
                            error={errors.text}
                            required
                            className="sm:col-span-2"
                        >
                            <RichTextEditor
                                {...fieldA11y('text', errors.text)}
                                name="text"
                                required
                                defaultValue={question?.text}
                            />
                        </FormField>
                        <FormField
                            id="sort_order"
                            label="Urutan"
                            description="Kosongkan untuk menaruh di akhir sub dimensi."
                            error={errors.sort_order}
                        >
                            <Input
                                {...fieldA11y('sort_order', errors.sort_order)}
                                type="number"
                                min={0}
                                name="sort_order"
                                defaultValue={question?.sort_order}
                            />
                        </FormField>
                    </FormCard>
                )}
            </MasterForm>
        </>
    );
}

QuestionForm.layout = {
    breadcrumbs: [{ title: 'Pertanyaan', href: index() }],
};
