<?php

use App\Models\Company;
use App\Models\Dimension;
use App\Models\ParticipantProfile;
use App\Models\Question;
use App\Models\SubDimension;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->admin()->create();
});

it('akses: tamu dan peserta ditolak, admin boleh', function (string $url) {
    $this->get($url)->assertRedirect('/login');
    $this->actingAs(User::factory()->participant()->create())->get($url)->assertForbidden();
    $this->actingAs($this->admin)->get($url)->assertOk();
})->with(['/admin/domains', '/admin/sub-domains', '/admin/questions', '/admin/companies']);

it('domain: CRUD, nama unik, hapus diblokir bila punya sub domain', function () {
    $this->actingAs($this->admin);

    $this->post('/admin/domains', ['name' => 'Kepemimpinan', 'is_active' => 1])->assertRedirect();
    $domain = Dimension::firstWhere('name', 'Kepemimpinan');
    expect($domain)->not->toBeNull();

    $this->post('/admin/domains', ['name' => 'Kepemimpinan', 'is_active' => 1])->assertSessionHasErrors('name');
    $this->put("/admin/domains/{$domain->id}", ['name' => 'Kepemimpinan', 'is_active' => 0])->assertSessionHasNoErrors();
    expect($domain->fresh()->is_active)->toBeFalse();

    SubDimension::factory()->create(['dimension_id' => $domain->id]);
    $this->delete("/admin/domains/{$domain->id}");
    expect(Dimension::find($domain->id))->not->toBeNull();

    $empty = Dimension::factory()->create();
    $this->delete("/admin/domains/{$empty->id}");
    expect(Dimension::find($empty->id))->toBeNull();
});

it('domain show: hirarki domain > sub domain > pertanyaan', function () {
    $domain = Dimension::factory()->create();
    $sub = SubDimension::factory()->create(['dimension_id' => $domain->id]);
    Question::factory()->count(2)->create(['sub_dimension_id' => $sub->id]);

    $this->actingAs($this->admin)->get("/admin/domains/{$domain->id}")
        ->assertInertia(fn (Assert $p) => $p->component('admin/domains/show')
            ->has('domain.sub_domains', 1)
            ->has('domain.sub_domains.0.questions', 2));
});

it('sub domain: CRUD, validasi, hapus diblokir bila punya pertanyaan, filter domain', function () {
    $this->actingAs($this->admin);
    $domain = Dimension::factory()->create();
    $other = Dimension::factory()->create();

    $this->post('/admin/sub-domains', ['name' => 'X'])->assertSessionHasErrors('dimension_id');
    $this->post('/admin/sub-domains', ['dimension_id' => $domain->id, 'name' => 'Visi'])->assertRedirect();
    $sub = SubDimension::firstWhere('name', 'Visi');
    $this->post('/admin/sub-domains', ['dimension_id' => $domain->id, 'name' => 'Visi'])->assertSessionHasErrors('name');
    $this->put("/admin/sub-domains/{$sub->id}", ['dimension_id' => $domain->id, 'name' => 'Visi 2'])->assertSessionHasNoErrors();
    expect($sub->fresh()->name)->toBe('Visi 2');

    SubDimension::factory()->create(['dimension_id' => $other->id]);
    $this->get("/admin/sub-domains?dimension_id={$domain->id}")
        ->assertInertia(fn (Assert $p) => $p->has('subDomains.data', 1));

    Question::factory()->create(['sub_dimension_id' => $sub->id]);
    $this->delete("/admin/sub-domains/{$sub->id}");
    expect(SubDimension::find($sub->id))->not->toBeNull();
});

it('pertanyaan: CRUD, soft delete, search', function () {
    $this->actingAs($this->admin);
    $sub = SubDimension::factory()->create();

    $this->post('/admin/questions', ['sub_dimension_id' => 999999, 'text' => 'a'])->assertSessionHasErrors('sub_dimension_id');
    $this->post('/admin/questions', ['sub_dimension_id' => $sub->id, 'text' => ''])->assertSessionHasErrors('text');
    $this->post('/admin/questions', ['sub_dimension_id' => $sub->id, 'text' => 'Saya jujur 100%'])->assertRedirect();
    $q = Question::firstWhere('text', 'Saya jujur 100%');
    Question::factory()->create(['sub_dimension_id' => $sub->id, 'text' => 'Lain']);

    $this->get('/admin/questions?search=100%25')
        ->assertInertia(fn (Assert $p) => $p->has('questions.data', 1));
    $this->get('/admin/questions/create?sub_dimension_id='.$sub->id)
        ->assertInertia(fn (Assert $p) => $p->where('defaultSubDomainId', $sub->id));

    $this->delete("/admin/questions/{$q->id}");
    $this->assertSoftDeleted($q);
});

it('perusahaan: CRUD, nama unik, hapus diblokir bila dipakai peserta', function () {
    $this->actingAs($this->admin);

    $this->post('/admin/companies', ['name' => 'PT Maju'])->assertRedirect();
    $this->post('/admin/companies', ['name' => 'PT Maju'])->assertSessionHasErrors('name');
    $company = Company::firstWhere('name', 'PT Maju');
    $this->put("/admin/companies/{$company->id}", ['name' => 'PT Maju Jaya'])->assertSessionHasNoErrors();

    ParticipantProfile::factory()->create([
        'user_id' => User::factory()->participant()->create()->id, 'company_id' => $company->id,
    ]);
    $this->delete("/admin/companies/{$company->id}");
    expect(Company::find($company->id))->not->toBeNull();

    $free = Company::factory()->create();
    $this->delete("/admin/companies/{$free->id}");
    expect(Company::find($free->id))->toBeNull();
});

it('menuCounts: hitung dimensi, sub dimensi, pertanyaan tanpa yang soft-deleted', function () {
    $sub = SubDimension::factory()->create();
    $deletedSub = SubDimension::factory()->create();
    Question::factory()->count(2)->create(['sub_dimension_id' => $sub->id]);
    Question::factory()->create(['sub_dimension_id' => $sub->id])->delete();
    $deletedSub->delete();

    $this->actingAs($this->admin)->get('/admin/domains')->assertInertia(fn (Assert $page) => $page
        ->where('menuCounts.dimensions', Dimension::count())
        ->where('menuCounts.sub_dimensions', 1)
        ->where('menuCounts.questions', 2));
});

it('pertanyaan: bulk hapus = soft delete + activity log, hanya admin', function () {
    $sub = SubDimension::factory()->create();
    $qs = Question::factory()->count(3)->create(['sub_dimension_id' => $sub->id]);
    $ids = $qs->take(2)->pluck('id')->all();

    $this->post('/admin/questions/bulk', ['ids' => $ids])->assertRedirect('/login');
    $this->actingAs(User::factory()->participant()->create())->post('/admin/questions/bulk', ['ids' => $ids])->assertForbidden();

    $this->actingAs($this->admin)->post('/admin/questions/bulk', ['ids' => []])->assertSessionHasErrors('ids');
    $this->actingAs($this->admin)->post('/admin/questions/bulk', ['ids' => [999999]])->assertSessionHasErrors('ids.0');

    $this->actingAs($this->admin)->post('/admin/questions/bulk', ['ids' => $ids])->assertRedirect();

    expect(Question::count())->toBe(1)
        ->and(Question::onlyTrashed()->count())->toBe(2)
        ->and(Activity::where('event', 'deleted')->where('subject_type', Question::class)->count())->toBe(2);
});

it('pertanyaan: HTML disanitasi (hanya format dasar, tanpa atribut), kosong ditolak', function () {
    $this->actingAs($this->admin);
    $sub = SubDimension::factory()->create();

    $this->post('/admin/questions', ['sub_dimension_id' => $sub->id, 'text' => '<p onclick="x()">Halo <b>dunia</b><script>alert(1)</script></p>'])->assertRedirect();
    expect(Question::latest('id')->first()->text)->toBe('<p>Halo <b>dunia</b>alert(1)</p>');

    $this->post('/admin/questions', ['sub_dimension_id' => $sub->id, 'text' => '<p><br></p>'])->assertSessionHasErrors('text');
});
