import { useEffect, useRef, useState } from 'react';

type Props = {
    id: string;
    name: string;
    defaultValue?: string;
    required?: boolean;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
};

/**
 * Summernote (lite, tanpa Bootstrap) dimuat lazy. Nilai HTML disimpan di
 * input hidden agar ikut dikirim oleh <Form> Inertia.
 */
export function RichTextEditor({
    id,
    name,
    defaultValue = '',
    required,
    ...aria
}: Props) {
    const host = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        let $editor: JQuery | undefined;
        let cancelled = false;

        (async () => {
            const { default: $ } = await import('jquery');
            (window as unknown as { jQuery: unknown }).jQuery = $;
            await import('summernote/dist/summernote-lite.js');
            await import('summernote/dist/summernote-lite.css');

            if (cancelled || !host.current) {
                return;
            }

            $editor = $(host.current);
            $editor.summernote({
                height: 160,
                placeholder: 'Tulis pertanyaan…',
                toolbar: [
                    ['style', ['bold', 'italic', 'underline']],
                    ['para', ['ul', 'ol']],
                    ['misc', ['undo', 'redo']],
                ],
                callbacks: {
                    onChange: (html: string) => setValue(html),
                    onPaste: (e: ClipboardEvent) => {
                        e.preventDefault();
                        const text = e.clipboardData?.getData('text/plain');
                        document.execCommand('insertText', false, text);
                    },
                },
            });
            $editor.summernote('code', defaultValue);
        })();

        return () => {
            cancelled = true;
            $editor?.summernote('destroy');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div id={id} {...aria}>
            <div ref={host} />
            <input
                type="hidden"
                name={name}
                value={value}
                required={required}
            />
        </div>
    );
}
