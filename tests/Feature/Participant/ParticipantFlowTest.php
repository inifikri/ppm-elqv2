<?php

namespace Tests\Feature\Participant;

use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->participant = User::factory()->participant()->create();
    $this->admin = User::factory()->admin()->create();
});

it('tamu diarahkan ke login', function () {
    $this->get(route('participant.evaluators.setup'))->assertRedirect('/login');
    $this->get(route('participant.assessment.run'))->assertRedirect('/login');
    $this->get(route('participant.dashboard'))->assertRedirect('/login');
});

it('non-peserta mendapatkan 403 saat mengakses rute peserta', function () {
    $this->actingAs($this->admin)->get(route('participant.evaluators.setup'))->assertForbidden();
    $this->actingAs($this->admin)->get(route('participant.assessment.run'))->assertForbidden();
    $this->actingAs($this->admin)->get(route('participant.dashboard'))->assertForbidden();
});

it('peserta tanpa penilai diarahkan ke langkah pendaftaran penilai', function () {
    $this->actingAs($this->participant)->get(route('dashboard'))
        ->assertRedirect(route('participant.evaluators.setup'));

    $this->actingAs($this->participant)->get(route('participant.assessment.run'))
        ->assertRedirect(route('dashboard'));

    $this->actingAs($this->participant)->get(route('participant.dashboard'))
        ->assertRedirect(route('participant.evaluators.setup'));
});

it('peserta dengan penilai tetapi belum submit diarahkan ke pengerjaan asesmen', function () {
    // Buat raters lengkap (self belum submit)
    Rater::factory()->selfRater()->create(['participant_id' => $this->participant->id]);
    Rater::factory()->boss()->create(['participant_id' => $this->participant->id]);
    Rater::factory()->subordinate()->count(3)->create(['participant_id' => $this->participant->id]);

    $this->actingAs($this->participant)->get(route('dashboard'))
        ->assertRedirect(route('participant.assessment.run'));

    $this->actingAs($this->participant)->get(route('participant.evaluators.setup'))
        ->assertRedirect(route('participant.assessment.run'));

    // Buka assessment run sukses
    $this->actingAs($this->participant)->get(route('participant.assessment.run'))
        ->assertOk();
});

it('peserta yang sudah submit diarahkan ke dashboard dan dilarang kembali ke asesmen', function () {
    Rater::factory()->selfRater()->submitted()->create(['participant_id' => $this->participant->id]);
    Rater::factory()->boss()->create(['participant_id' => $this->participant->id]);
    Rater::factory()->subordinate()->count(3)->create(['participant_id' => $this->participant->id]);

    // Dashboard peserta sukses terbuka
    $this->actingAs($this->participant)->get(route('dashboard'))
        ->assertOk();

    // Akses setup atau run dialihkan
    $this->actingAs($this->participant)->get(route('participant.evaluators.setup'))
        ->assertRedirect(route('dashboard'));

    $this->actingAs($this->participant)->get(route('participant.assessment.run'))
        ->assertRedirect(route('dashboard'));
});
