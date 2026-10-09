import { Form } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { ComponentProps, ReactNode } from 'react';
import { BackButton } from '@/components/back-button';
import { FormFooter } from '@/components/form-footer';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { UnsavedChangesGuard } from '@/components/unsaved-changes-guard';

/** Shared create/edit shell: back, header, FormCard(s) as children, uniform footer. */
export function MasterForm({
    title,
    form,
    cancelHref,
    resettable = false,
    children,
}: {
    title: string;
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    cancelHref: InertiaLinkProps['href'];
    /** Adds a Reset button (use on edit forms). */
    resettable?: boolean;
    children: (errors: Record<string, string>) => ReactNode;
}) {
    return (
        <PageContainer narrow>
            <BackButton href={cancelHref} />
            <PageHeader title={title} />
            <Form {...form} className="space-y-4">
                {({ processing, errors, isDirty, reset }) => (
                    <>
                        <UnsavedChangesGuard dirty={isDirty} />
                        {children(errors)}
                        <FormFooter
                            processing={processing}
                            cancelHref={cancelHref}
                            onReset={resettable ? () => reset() : undefined}
                            canReset={isDirty}
                        />
                    </>
                )}
            </Form>
        </PageContainer>
    );
}

export const fieldA11y = (id: string, error?: string) => ({
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
});
