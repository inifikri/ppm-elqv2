<?php

namespace Tests\Feature\Admin\Results;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Jobs\SendAssessmentResultPdfJob;
use App\Mail\AssessmentResultMail;
use App\Models\Answer;
use App\Models\Dimension;
use App\Models\EmailLog;
use App\Models\Question;
use App\Models\Rater;
use App\Models\SubDimension;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->admin()->create();
    $this->participant = User::factory()->participant()->create();
});

it('otorisasi: tamu redirect, peserta 403, admin boleh akses show, pdf, send-pdf', function () {
    $urlShow = "/admin/participants/{$this->participant->id}/result";
    $urlPdf = "/admin/participants/{$this->participant->id}/result/pdf";
    $urlSend = "/admin/participants/{$this->participant->id}/result/send-pdf";

    // Tamu -> redirect login
    $this->get($urlShow)->assertRedirect('/login');
    $this->get($urlPdf)->assertRedirect('/login');
    $this->post($urlSend)->assertRedirect('/login');

    // Peserta lain -> 403
    $other = User::factory()->participant()->create();
    $this->actingAs($other)->get($urlShow)->assertForbidden();
    $this->actingAs($other)->get($urlPdf)->assertForbidden();
    $this->actingAs($other)->post($urlSend)->assertForbidden();

    // Peserta itu sendiri -> tetap 403 (peserta tidak boleh melihat hasil, FR-015/FR-017)
    $this->actingAs($this->participant)->get($urlShow)->assertForbidden();
    $this->actingAs($this->participant)->get($urlPdf)->assertForbidden();
    $this->actingAs($this->participant)->post($urlSend)->assertForbidden();

    // Admin -> boleh
    $this->actingAs($this->admin)->get($urlShow)->assertOk();
});

it('show: merender inertia component dengan data perhitungan', function () {
    $dim = Dimension::factory()->create(['name' => 'Dimensi Test', 'sort_order' => 1]);
    $sub = SubDimension::factory()->create(['dimension_id' => $dim->id, 'name' => 'Sub Test', 'sort_order' => 1]);
    $q = Question::factory()->create(['sub_dimension_id' => $sub->id, 'sort_order' => 1]);

    $self = Rater::factory()->selfRater()->submitted()->create(['participant_id' => $this->participant->id]);
    Answer::factory()->create(['rater_id' => $self->id, 'question_id' => $q->id, 'value' => 5]);

    $this->actingAs($this->admin)
        ->get("/admin/participants/{$this->participant->id}/result")
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/participants/result/show')
            ->has('result')
            ->where('result.has_data', true)
            ->where('result.overall_score', fn ($score) => (float) $score === 5.0)
            ->where('result.participant.id', $this->participant->id)
        );
});

it('detail: mengembalikan json terpaginasi untuk tabel rincian jawaban', function () {
    $dim = Dimension::factory()->create(['name' => 'Dimensi Test', 'sort_order' => 1]);
    $sub = SubDimension::factory()->create(['dimension_id' => $dim->id, 'name' => 'Sub Test', 'sort_order' => 1]);
    $q = Question::factory()->create(['sub_dimension_id' => $sub->id, 'text' => 'Apakah pemimpin tegas?', 'sort_order' => 1]);

    $self = Rater::factory()->selfRater()->submitted()->create(['participant_id' => $this->participant->id]);
    Answer::factory()->create(['rater_id' => $self->id, 'question_id' => $q->id, 'value' => 6]);

    $response = $this->actingAs($this->admin)
        ->getJson("/admin/participants/{$this->participant->id}/result/detail");

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'text', 'dimension_name', 'sub_dimension_name', 'self_score', 'boss_score', 'subordinate_score', 'average'],
            ],
            'current_page',
            'total',
        ]);

    $data = $response->json('data');
    expect((float) $data[0]['self_score'])->toBe(6.0);
});

it('pdf: mengembalikan response application/pdf dan tidak menyimpan file di disk', function () {
    $dim = Dimension::factory()->create(['name' => 'Dimensi 1', 'sort_order' => 1]);
    $sub = SubDimension::factory()->create(['dimension_id' => $dim->id, 'name' => 'Sub 1', 'sort_order' => 1]);
    $q = Question::factory()->create(['sub_dimension_id' => $sub->id, 'sort_order' => 1]);

    $self = Rater::factory()->selfRater()->submitted()->create(['participant_id' => $this->participant->id]);
    Answer::factory()->create(['rater_id' => $self->id, 'question_id' => $q->id, 'value' => 4]);

    $response = $this->actingAs($this->admin)
        ->get("/admin/participants/{$this->participant->id}/result/pdf");

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf')
        ->and($response->headers->get('content-disposition'))->toContain("hasil-assessment-{$this->participant->name}.pdf");
});

it('sendPdf: job ter-queue, hanya ke email akun peserta, email_logs terisi, activity log tidak memuat nilai jawaban', function () {
    Queue::fake();

    $attackerEmail = 'attacker@evil.com';

    // Mencoba manipulasi email penerima via payload request (harus diabaikan, hanya email peserta yang dipakai)
    $response = $this->actingAs($this->admin)
        ->post("/admin/participants/{$this->participant->id}/result/send-pdf", [
            'recipient_email' => $attackerEmail,
            'email' => $attackerEmail,
        ]);

    $response->assertRedirect();

    // Verifikasi Job ter-queue
    Queue::assertPushed(SendAssessmentResultPdfJob::class, function (SendAssessmentResultPdfJob $job) {
        return $job->participant->id === $this->participant->id;
    });

    // Verifikasi email_logs terisi dengan email peserta (bukan input user)
    $log = EmailLog::where('user_id', $this->participant->id)->latest()->first();
    expect($log)->not->toBeNull()
        ->and($log->recipient_email)->toBe($this->participant->email)
        ->and($log->recipient_email)->not->toBe($attackerEmail)
        ->and($log->type)->toBe(EmailLogType::ResultShare)
        ->and($log->status)->toBe(EmailLogStatus::Queued);

    // Verifikasi activity_log (FR-044: tidak memuat nilai jawaban, token, atau URL bertanda tangan)
    $activity = Activity::where('log_name', 'results')
        ->where('subject_id', $this->participant->id)
        ->latest('id')
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->causer_id)->toBe($this->admin->id)
        ->and($activity->properties->toArray())->toBeEmpty(); // Tanpa nilai jawaban / payload rahasia
});

it('job send assessment pdf: menghasilkan pdf di memori, mengirim mailable, dan update status email_logs menjadi sent', function () {
    Mail::fake();

    $dim = Dimension::factory()->create(['name' => 'Dimensi A', 'sort_order' => 1]);
    $sub = SubDimension::factory()->create(['dimension_id' => $dim->id, 'name' => 'Sub A', 'sort_order' => 1]);
    $q = Question::factory()->create(['sub_dimension_id' => $sub->id, 'sort_order' => 1]);

    $self = Rater::factory()->selfRater()->submitted()->create(['participant_id' => $this->participant->id]);
    Answer::factory()->create(['rater_id' => $self->id, 'question_id' => $q->id, 'value' => 5]);

    $emailLog = EmailLog::create([
        'type' => EmailLogType::ResultShare,
        'recipient_email' => $this->participant->email,
        'user_id' => $this->participant->id,
        'status' => EmailLogStatus::Queued,
        'queued_at' => now(),
    ]);

    $job = new SendAssessmentResultPdfJob($this->participant, $emailLog->id);
    app()->call([$job, 'handle']);

    Mail::assertSent(AssessmentResultMail::class, function (AssessmentResultMail $mail) {
        return $mail->hasTo($this->participant->email) &&
            $mail->participant->id === $this->participant->id &&
            ! empty($mail->pdfContent);
    });

    expect($emailLog->fresh()->status)->toBe(EmailLogStatus::Sent)
        ->and($emailLog->fresh()->sent_at)->not->toBeNull()
        ->and($emailLog->fresh()->attempts)->toBe(1);
});

it('otorisasi index: tamu redirect, peserta 403, admin boleh akses', function () {
    $this->get('/admin/results')->assertRedirect('/login');

    $this->actingAs($this->participant)->get('/admin/results')->assertForbidden();

    $this->actingAs($this->admin)->get('/admin/results')->assertOk();
});

it('index: merender inertia component dengan daftar peserta terpaginasi dan status rater', function () {
    $self = Rater::factory()->selfRater()->submitted()->create(['participant_id' => $this->participant->id]);
    $boss = Rater::factory()->bossRater()->create(['participant_id' => $this->participant->id]); // belum submit

    $this->actingAs($this->admin)
        ->get('/admin/results')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/participants/result/index')
            ->has('participants.data', 1)
            ->where('participants.data.0.id', $this->participant->id)
            ->where('participants.data.0.raters_status.self', true)
            ->where('participants.data.0.raters_status.boss', false)
            ->where('participants.data.0.has_data', true)
            ->where('participants.data.0.is_completed', false)
        );
});

it('index: filter pencarian memfilter berdasarkan nama peserta', function () {
    $other = User::factory()->participant()->create(['name' => 'Budi Santoso']);

    $response = $this->actingAs($this->admin)
        ->get('/admin/results?search=Budi')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/participants/result/index')
            ->has('participants.data', 1)
            ->where('participants.data.0.id', $other->id)
        );
});
