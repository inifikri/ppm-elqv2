<?php

use App\Models\User;

test('404 error page renders for non-existent route with blade or inertia', function () {
    $response = $this->get('/halaman-acak-yang-tidak-ada-12345');

    $response->assertStatus(404);
});

test('403 error page renders when unauthorized action is triggered', function () {
    $participant = User::factory()->participant()->create();

    $this->actingAs($participant)
        ->get('/admin/participants')
        ->assertForbidden();
});
