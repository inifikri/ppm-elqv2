<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AssessmentResultMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $participant,
        public string $pdfContent
    ) {}

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
                "hasil-assessment-{$this->participant->name}.pdf"
            )->withMime('application/pdf'),
        ];
    }
}
