<?php

namespace App\Mail;

use App\Models\Question;
use App\Models\Rater;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AssessmentInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Rater $rater
    ) {}

    public function envelope(): Envelope
    {
        $participantName = $this->rater->participant?->name ?? 'Rekan Kerja';

        return new Envelope(
            subject: "Undangan Penilaian Kepemimpinan 360° - {$participantName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.assessment-invitation',
            with: [
                'rater' => $this->rater,
                'participant' => $this->rater->participant,
                'roleLabel' => $this->rater->role?->label() ?? 'Penilai',
                'evaluationUrl' => url("/rater/{$this->rater->ulid}"),
                'questionCount' => Question::count(),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
