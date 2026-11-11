import { Head } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { fieldA11y, MasterForm } from '@/components/master-form';
import { SelectField } from '@/components/select-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { index, store, update } from '@/routes/admin/questions';
import type { QuestionRow, SubDomainOption } from '@/types';

export default function QuestionForm({
    question,
    subDomains,
    defaultSubDomainId,
    answersCount = 0,
}: {
    question: QuestionRow | null;
    subDomains: SubDomainOption[];
    defaultSubDomainId: number | null;
    answersCount?: number;
}) {
    const title = question ? 'Ubah pertanyaan' : 'Tambah pertanyaan';
    const totalAnswers = answersCount ?? question?.answers_count ?? 0;

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const isConfirmedRef = useRef(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (question && totalAnswers > 0 && !isConfirmedRef.current) {
            e.preventDefault();
            setConfirmDialogOpen(true);
            return;
        }
        isConfirmedRef.current = false;
    };

    const handleConfirmSubmit = () => {
        isConfirmedRef.current = true;
        setConfirmDialogOpen(false);
        const formEl = document.getElementById(
            'question-form',
        ) as HTMLFormElement | null;
        formEl?.requestSubmit();
    };

    const formDef = question
        ? typeof update.form === 'function'
            ? update.form(question.id)
            : {
                  action: update.url(question.id, {
                      query: { _method: 'PUT' },
                  }),
                  method: 'post' as const,
              }
        : typeof store.form === 'function'
          ? store.form()
          : { action: store.url(), method: 'post' as const };

    return (
        <>
            <Head title={title} />
            <MasterForm
                id="question-form"
                title={title}
                form={formDef}
                cancelHref={index()}
                resettable={question !== null}
                onSubmit={handleSubmit}
            >
                {(errors) => (
                    <>
                        {totalAnswers > 0 && (
                            <Alert
                                variant="warning"
                                className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                            >
                                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                                <AlertTitle className="font-semibold text-amber-800 dark:text-amber-300">
                                    Pertanyaan Memiliki Riwayat Jawaban (
                                    {totalAnswers} Jawaban)
                                </AlertTitle>
                                <AlertDescription className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                                    Pertanyaan ini sudah memiliki jawaban dari
                                    responden. Anda diperbolehkan mengubah teks
                                    atau sub dimensi sesuai ketentuan FR-027,
                                    namun perubahan berisiko memengaruhi
                                    interpretasi penilaian dan konsistensi data
                                    historis asesmen terdahulu.
                                </AlertDescription>
                            </Alert>
                        )}

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
                                    question?.sub_dimension_id ??
                                    defaultSubDomainId
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
                                <Textarea
                                    {...fieldA11y('text', errors.text)}
                                    id="text"
                                    name="text"
                                    required
                                    rows={4}
                                    placeholder="Tuliskan butir pernyataan atau pertanyaan kuesioner..."
                                    defaultValue={question?.text}
                                    className="min-h-[100px] resize-y"
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
                    </>
                )}
            </MasterForm>

            {/* Modal Dialog Konfirmasi Risiko Sebelum Simpan */}
            <AlertDialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-lg rounded-2xl p-6 sm:p-7">
                    <AlertDialogHeader>
                        <div className="mb-1 flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-lg font-bold text-foreground">
                                    Konfirmasi Perubahan Pertanyaan
                                </AlertDialogTitle>
                                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                    Pertanyaan telah memiliki {totalAnswers}{' '}
                                    jawaban responden
                                </p>
                            </div>
                        </div>
                        <AlertDialogDescription className="space-y-3 pt-2 text-sm leading-relaxed text-muted-foreground">
                            <p>
                                Pertanyaan ini sudah memiliki{' '}
                                <strong className="text-foreground">
                                    {totalAnswers} jawaban
                                </strong>{' '}
                                dari responden yang telah mengisi asesmen.
                            </p>
                            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                                <strong className="font-semibold text-amber-800 dark:text-amber-300">
                                    Peringatan Risiko (FR-027):
                                </strong>{' '}
                                Mengubah kalimat pertanyaan atau memindahkan sub
                                dimensi berisiko mengubah interpretasi
                                penilaian, memengaruhi konsistensi butir soal,
                                dan menurunkan validitas komparasi skor dengan
                                data asesmen terdahulu.
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Setiap pembaruan akan dicatat ke dalam audit log
                                sistem. Apakah Anda yakin ingin melanjutkan dan
                                menyimpan perubahan ini?
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel
                            onClick={() => setConfirmDialogOpen(false)}
                        >
                            Periksa Kembali
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSubmit}
                            className="bg-amber-600 font-medium text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
                        >
                            Ya, Simpan Perubahan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

QuestionForm.layout = {
    breadcrumbs: [{ title: 'Pertanyaan', href: index() }],
};
