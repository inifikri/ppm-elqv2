<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('styleguide is 404 outside local', function () {
    $this->actingAs(User::factory()->create())->get('/styleguide')->assertNotFound();
});

test('styleguide renders in local', function () {
    app()->detectEnvironment(fn () => 'local');

    $this->actingAs(User::factory()->create())
        ->get('/styleguide')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('styleguide'));
});

test('styleguide requires auth', function () {
    $this->get('/styleguide')->assertRedirect(route('login'));
});
