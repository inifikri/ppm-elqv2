<?php

namespace App\Enums;

/**
 * Daftar permission awal (usulan, mudah diubah di satu tempat ini).
 */
enum PermissionName: string
{
    case UsersManage = 'users.manage';
    case RolesPermissionsManage = 'roles.permissions.manage';
    case DimensionsManage = 'dimensions.manage';
    case SubDimensionsManage = 'sub-dimensions.manage';
    case QuestionsManage = 'questions.manage';
    case ParticipantsView = 'participants.view';
    case ResultsView = 'results.view';
    case ResultsShare = 'results.share';
    case ResultsExport = 'results.export';
    case ActivityLogView = 'activity-log.view';
    case EmailLogManage = 'email-log.manage';
    case SettingsManage = 'settings.manage';
    case RatersManageOwn = 'raters.manage-own';
    case AssessmentFillSelf = 'assessment.fill-self';

    public function group(): string
    {
        return match ($this) {
            self::UsersManage, self::RolesPermissionsManage => 'Pengguna',
            self::DimensionsManage, self::SubDimensionsManage, self::QuestionsManage => 'Kuesioner',
            self::ParticipantsView, self::ResultsView, self::ResultsShare, self::ResultsExport => 'Hasil',
            self::ActivityLogView, self::EmailLogManage, self::SettingsManage => 'Sistem',
            self::RatersManageOwn, self::AssessmentFillSelf => 'Assessment',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::UsersManage => 'Kelola pengguna',
            self::RolesPermissionsManage => 'Kelola hak akses role',
            self::DimensionsManage => 'Kelola dimensi',
            self::SubDimensionsManage => 'Kelola sub-dimensi',
            self::QuestionsManage => 'Kelola pertanyaan',
            self::ParticipantsView => 'Lihat peserta',
            self::ResultsView => 'Lihat hasil',
            self::ResultsShare => 'Bagikan hasil',
            self::ResultsExport => 'Ekspor hasil',
            self::ActivityLogView => 'Lihat log aktivitas',
            self::EmailLogManage => 'Kelola log email',
            self::SettingsManage => 'Kelola pengaturan',
            self::RatersManageOwn => 'Kelola penilai sendiri',
            self::AssessmentFillSelf => 'Isi assessment sendiri',
        };
    }

    /**
     * Permission yang boleh dimiliki sebuah role (admin = semua, peserta = grup Assessment).
     *
     * @return list<self>
     */
    public static function forRole(UserRole $role): array
    {
        return $role === UserRole::Admin
            ? self::cases()
            : array_values(array_filter(self::cases(), fn (self $p) => $p->group() === 'Assessment'));
    }

    /**
     * Permission awal untuk pengguna baru.
     *
     * @return list<self>
     */
    public static function defaultsFor(UserRole $role): array
    {
        return $role === UserRole::Participant ? self::forRole($role) : [];
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
