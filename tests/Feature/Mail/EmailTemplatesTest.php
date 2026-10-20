<?php

use App\Enums\RaterRole;
use App\Mail\AssessmentInvitationMail;
use App\Mail\AssessmentResultMail;
use App\Models\ParticipantProfile;
use App\Models\Rater;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->admin()->create();
});

it('template undangan penilai berhasil di-render dengan data yang benar', function () {
    $participant = User::factory()->participant()->create([
        'name' => 'Dr. Hendra Wijaya',
        'email' => 'hendra.wijaya@example.com',
    ]);
    ParticipantProfile::factory()->create([
        'user_id' => $participant->id,
        'position' => 'Direktur Operasional',
    ]);

    $rater = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'atasan.hendra@example.com',
    ]);

    $mailable = new AssessmentInvitationMail($rater);
    $mailable->assertSeeInHtml('ELQ');
    $mailable->assertSeeInHtml('360°');
    $mailable->assertSeeInHtml('Undangan Penilaian Kepemimpinan');
    $mailable->assertSeeInHtml('Dr. Hendra Wijaya');
    $mailable->assertSeeInHtml('Atasan Langsung');
    $mailable->assertSeeInHtml(url("/rater/{$rater->ulid}"));
});

it('template kirim hasil asesmen berhasil di-render dengan lampiran PDF', function () {
    $participant = User::factory()->participant()->create([
        'name' => 'Siti Nurhaliza',
        'email' => 'siti.nurhaliza@example.com',
    ]);

    $mailable = new AssessmentResultMail($participant, '%PDF-1.4 dummy content');
    $mailable->assertSeeInHtml('Laporan Hasil Asesmen');
    $mailable->assertSeeInHtml('Siti Nurhaliza');
    $mailable->assertSeeInHtml('hasil-assessment-Siti Nurhaliza.pdf');
    $mailable->assertSeeInHtml(url('/dashboard'));
});

it('notifikasi reset password menggunakan template custom bernuansa ELQ 360', function () {
    $user = User::factory()->create([
        'name' => 'Ahmad Fauzi',
        'email' => 'ahmad.fauzi@example.com',
    ]);

    $notification = new ResetPassword('sample-test-token-12345');
    $mailMessage = $notification->toMail($user);

    expect($mailMessage->view)->toBe('mail.reset-password');
    expect($mailMessage->subject)->toContain('Permintaan Atur Ulang Password');

    $html = view($mailMessage->view, $mailMessage->viewData)->render();
    expect($html)->toContain('Atur Ulang Kata Sandi')
        ->and($html)->toContain('Ahmad Fauzi')
        ->and($html)->toContain('sample-test-token-12345')
        ->and($html)->toContain('menit');
});

it('notifikasi verifikasi email menggunakan template custom bernuansa ELQ 360', function () {
    $user = User::factory()->unverified()->create([
        'name' => 'Rina Andriani',
        'email' => 'rina.andriani@example.com',
    ]);

    $notification = new VerifyEmail;
    $mailMessage = $notification->toMail($user);

    expect($mailMessage->view)->toBe('mail.verify-email');
    expect($mailMessage->subject)->toContain('Verifikasi Alamat Email');

    $html = view($mailMessage->view, $mailMessage->viewData)->render();
    expect($html)->toContain('Verifikasi Alamat Email Anda')
        ->and($html)->toContain('Rina Andriani')
        ->and($html)->toContain('Langkah Selanjutnya Setelah Verifikasi');
});

it('admin dapat melihat live preview seluruh template email di browser', function () {
    $this->actingAs($this->admin)
        ->get('/admin/email-templates/preview?template=invitation_boss')
        ->assertOk()
        ->assertSee('Atasan Langsung');

    $this->actingAs($this->admin)
        ->get('/admin/email-templates/preview?template=invitation_subordinate')
        ->assertOk()
        ->assertSee('Rekan Bawahan');

    $this->actingAs($this->admin)
        ->get('/admin/email-templates/preview?template=result')
        ->assertOk()
        ->assertSee('Laporan Hasil Asesmen');

    $this->actingAs($this->admin)
        ->get('/admin/email-templates/preview?template=reset-password')
        ->assertOk()
        ->assertSee('Atur Ulang Kata Sandi');

    $this->actingAs($this->admin)
        ->get('/admin/email-templates/preview?template=verify-email')
        ->assertOk()
        ->assertSee('Verifikasi Alamat Email Anda');
});

it('peserta dan tamu ditolak mengakses preview template email admin', function () {
    $this->get('/admin/email-templates/preview')->assertRedirect('/login');

    $participant = User::factory()->participant()->create();
    $this->actingAs($participant)
        ->get('/admin/email-templates/preview')
        ->assertForbidden();
});
