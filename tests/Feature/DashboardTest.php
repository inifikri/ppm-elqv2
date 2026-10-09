<?php

use App\Enums\EmailLogStatus;
use App\Models\Answer;
use App\Models\EmailLog;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

describe('admin dashboard stats', function () {
    beforeEach(fn () => $this->seed(RolePermissionSeeder::class));

    it('participants do not receive stats', function () {
        $this->actingAs(User::factory()->participant()->create())
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('canViewStats', false)
                ->where('dashboard', null));
    });

    it('computes kpi, roles, dimensions and attention from real data', function () {
        $done = User::factory()->participant()->create();
        Rater::factory()->selfRater()->submitted()->create(['participant_id' => $done->id]);

        $partial = User::factory()->participant()->create();
        Rater::factory()->selfRater()->submitted()->create(['participant_id' => $partial->id]);
        Rater::factory()->boss()->create(['participant_id' => $partial->id, 'created_at' => now()->subDays(10)]);

        User::factory()->participant()->create();
        User::factory()->participant()->inactive()->create();

        $question = Question::factory()->create();
        $submitted = Rater::query()->submitted()->first();
        Answer::factory()->create(['rater_id' => $submitted->id, 'question_id' => $question->id, 'value' => 4]);
        $pendingRater = Rater::query()->pending()->first();
        Answer::factory()->create(['rater_id' => $pendingRater->id, 'question_id' => $question->id, 'value' => 1]);

        EmailLog::factory()->create(['status' => EmailLogStatus::Failed]);

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('canViewStats', true)
                ->missing('dashboard')
                ->loadDeferredProps(fn (Assert $reload) => $reload
                    ->where('dashboard.kpi', [
                        'active' => 3,
                        'not_started' => 1,
                        'in_progress' => 1,
                        'completed' => 1,
                        'completion_rate' => 33,
                    ])
                    ->where('dashboard.roles.0.total', 2)
                    ->where('dashboard.roles.1.submitted', 0)
                    ->where('dashboard.dimensions.0.average', 4)
                    ->has('dashboard.recent_assessments', 2)
                    ->has('dashboard.attention', 3)
                    ->where('dashboard.attention.0.key', 'failed_emails')
                    ->where('dashboard.attention.1.key', 'stale_raters')
                    ->where('dashboard.attention.2.key', 'not_started')));
    });

    it('returns empty-safe stats when there is no data', function () {
        $this->actingAs(User::factory()->admin()->create())
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->loadDeferredProps(fn (Assert $reload) => $reload
                    ->where('dashboard.kpi.completion_rate', 0)
                    ->where('dashboard.dimensions', [])
                    ->where('dashboard.attention', [])));
    });
});

it('bell: admin dapat notifications, peserta tidak', function () {
    $this->seed(RolePermissionSeeder::class);

    $this->actingAs(User::factory()->admin()->create())->get('/dashboard')
        ->assertInertia(fn ($p) => $p->loadDeferredProps(fn ($p) => $p->has('notifications')));

    $this->actingAs(User::factory()->participant()->create())->get('/dashboard')
        ->assertInertia(fn ($p) => $p->where('notifications', []));
});
