<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Http\Controllers\Controller;
use App\Models\ParticipantProfile;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class EmailTemplatePreviewController extends Controller
{
    /**
     * Preview responsive email templates for administrators.
     */
    public function __invoke(Request $request): Response
    {
        Gate::authorize(PermissionName::EmailLogManage->value);

        $template = (string) $request->query('template', 'invitation_boss');
        $questionCount = Question::count() ?: 39;

        $dummyParticipant = new User([
            'name' => 'Budi Pratama, S.T., M.M.',
            'email' => 'budi.pratama@perusahaan.co.id',
        ]);
        $dummyParticipant->setRelation('participantProfile', new ParticipantProfile([
            'position' => 'Senior Vice President of Operations',
        ]));

        $dummyBossRater = (new Rater)->forceFill([
            'role' => RaterRole::Boss,
            'ulid' => '01JABCDEFGHJKMNPQRSTVWXYZ0',
        ]);
        $dummyBossRater->setRelation('participant', $dummyParticipant);

        $dummySubRater = (new Rater)->forceFill([
            'role' => RaterRole::Subordinate,
            'ulid' => '01JABCDEFGHJKMNPQRSTVWXYZ1',
        ]);
        $dummySubRater->setRelation('participant', $dummyParticipant);

        $html = match ($template) {
            'invitation_boss', 'invitation' => view('mail.assessment-invitation', [
                'rater' => $dummyBossRater,
                'participant' => $dummyParticipant,
                'roleLabel' => 'Atasan Langsung',
                'evaluationUrl' => url('/rater/'.$dummyBossRater->ulid),
                'questionCount' => $questionCount,
            ])->render(),

            'invitation_subordinate' => view('mail.assessment-invitation', [
                'rater' => $dummySubRater,
                'participant' => $dummyParticipant,
                'roleLabel' => 'Rekan Bawahan',
                'evaluationUrl' => url('/rater/'.$dummySubRater->ulid),
                'questionCount' => $questionCount,
            ])->render(),

            'result' => view('mail.assessment-result', [
                'participant' => $dummyParticipant,
            ])->render(),

            'reset-password' => view('mail.reset-password', [
                'user' => $dummyParticipant,
                'resetUrl' => url('/reset-password/sample-token?email='.urlencode($dummyParticipant->email)),
                'count' => 60,
            ])->render(),

            'verify-email' => view('mail.verify-email', [
                'user' => $dummyParticipant,
                'verificationUrl' => url('/email/verify/1/sample-hash'),
            ])->render(),

            default => abort(404, 'Template email tidak ditemukan.'),
        };

        return response($html)->header('Content-Type', 'text/html');
    }
}
