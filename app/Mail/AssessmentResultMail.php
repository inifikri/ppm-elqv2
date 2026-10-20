<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class AssessmentResultMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $filename;

    public function __construct(
        public User $participant,
        public string $pdfContent,
        ?string $filename = null,
    ) {
        $slug = Str::slug($participant->name) ?: 'peserta';
        $this->filename = $filename ?? ("ELQ-Result_{$slug}_".now()->format('Ymd').'.pdf');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Hasil Assessment ELQ 360 - {$this->participant->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.assessment-result',
            with: [
                'participant' => $this->participant,
                'filename' => $this->filename,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(
                fn () => $this->pdfContent,
                $this->filename
            )->withMime('application/pdf'),
        ];
    }
}
