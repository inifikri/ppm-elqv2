<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EffectivenessCategory;
use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Http\Controllers\Controller;
use App\Models\ParticipantProfile;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use App\Services\Reports\AssessmentReportData;
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
                'roleLabel' => 'Bawahan/Rekan',
                'evaluationUrl' => url('/rater/'.$dummySubRater->ulid),
                'questionCount' => $questionCount,
            ])->render(),

            'result' => view('mail.assessment-result', [
                'participant' => $dummyParticipant,
                'reportData' => $this->dummyReportData($dummyParticipant),
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

    private function dummyReportData(User $participant): AssessmentReportData
    {
        return new AssessmentReportData(
            participant: [
                'id' => $participant->id,
                'name' => $participant->name,
                'email' => $participant->email,
                'phone' => '08123456789',
                'company' => 'PT Semen Indonesia (Persero) Tbk',
                'position' => 'Senior Vice President of Operations',
            ],
            printedAt: now()->translatedFormat('d F Y'),
            hasData: true,
            answeredRaters: [
                'self' => ['submitted' => 1, 'total' => 1, 'is_complete' => true],
                'boss' => ['submitted' => 1, 'total' => 1, 'is_complete' => true],
                'subordinate' => ['submitted' => 3, 'total' => 3, 'is_complete' => true],
                'total_submitted' => 5,
                'total_raters' => 5,
                'is_all_complete' => true,
            ],
            overallScore: 5.12,
            overallCategory: EffectivenessCategory::fromScore(5.12),
            roleOverallScores: [
                'self' => 5.30,
                'boss' => 4.95,
                'subordinate' => 5.10,
            ],
            dimensions: [
                [
                    'id' => 1,
                    'name' => 'Task Oriented',
                    'sort_order' => 1,
                    'scores' => [
                        'average' => 5.25,
                        'self' => 5.40,
                        'boss' => 5.10,
                        'subordinate' => 5.25,
                    ],
                    'category' => EffectivenessCategory::fromScore(5.25),
                    'sub_dimensions' => [],
                ],
                [
                    'id' => 2,
                    'name' => 'People Oriented',
                    'sort_order' => 2,
                    'scores' => [
                        'average' => 4.90,
                        'self' => 5.10,
                        'boss' => 4.70,
                        'subordinate' => 4.90,
                    ],
                    'category' => EffectivenessCategory::fromScore(4.90),
                    'sub_dimensions' => [],
                ],
                [
                    'id' => 3,
                    'name' => 'Change Oriented',
                    'sort_order' => 3,
                    'scores' => [
                        'average' => 5.20,
                        'self' => 5.40,
                        'boss' => 5.05,
                        'subordinate' => 5.15,
                    ],
                    'category' => EffectivenessCategory::fromScore(5.20),
                    'sub_dimensions' => [],
                ],
            ]
        );
    }
}
