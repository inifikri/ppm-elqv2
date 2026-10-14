<?php

namespace App\Enums;

/**
 * Daftar permission sistem ELQ 360°.
 */
enum PermissionName: string
{
    case UsersManage = 'users.manage';
    case UsersResetPassword = 'users.reset-password';
    case UsersRestore = 'users.restore';
    case RolesPermissionsManage = 'roles.permissions.manage';
    case DimensionsManage = 'dimensions.manage';
    case SubDimensionsManage = 'sub-dimensions.manage';
    case QuestionsManage = 'questions.manage';
    case ParticipantsView = 'participants.view';
    case ParticipantsUpdate = 'participants.update';
    case ParticipantsBulk = 'participants.bulk';
    case ResultsView = 'results.view';
    case ResultsShare = 'results.share';
    case ResultsExport = 'results.export';
    case RatersResend = 'raters.resend';
    case RatersRevoke = 'raters.revoke';
    case ActivityLogView = 'activity-log.view';
    case EmailLogManage = 'email-log.manage';
    case SettingsManage = 'settings.manage';
    case RatersManageOwn = 'raters.manage-own';
    case AssessmentFillSelf = 'assessment.fill-self';
    case CompanyManage = 'company.manage';
    case ParticipantManage = 'participant.manage';

    public function group(): string
    {
        return match ($this) {
            self::UsersManage,
            self::UsersResetPassword,
            self::UsersRestore,
            self::RolesPermissionsManage => 'Pengguna',

            self::DimensionsManage,
            self::SubDimensionsManage,
            self::QuestionsManage => 'Kuesioner',

            self::ParticipantsView,
            self::ParticipantsUpdate,
            self::ParticipantsBulk,
            self::ParticipantManage,
            self::RatersResend,
            self::RatersRevoke => 'Peserta',

            self::ResultsView,
            self::ResultsShare,
            self::ResultsExport => 'Hasil',

            self::ActivityLogView,
            self::EmailLogManage,
            self::SettingsManage => 'Sistem',

            self::RatersManageOwn,
            self::AssessmentFillSelf => 'Assessment',

            self::CompanyManage => 'Company',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::UsersManage => 'Kelola pengguna',
            self::UsersResetPassword => 'Reset password pengguna',
            self::UsersRestore => 'Pulihkan data pengguna',
            self::RolesPermissionsManage => 'Kelola hak akses role',
            self::DimensionsManage => 'Kelola dimensi',
            self::SubDimensionsManage => 'Kelola sub-dimensi',
            self::QuestionsManage => 'Kelola pertanyaan',
            self::ParticipantsView => 'Lihat daftar peserta',
            self::ParticipantsUpdate => 'Ubah profil peserta',
            self::ParticipantsBulk => 'Aksi massal peserta',
            self::ParticipantManage => 'Kelola peserta',
            self::RatersResend => 'Kirim ulang undangan penilai',
            self::RatersRevoke => 'Cabut link penilai',
            self::ResultsView => 'Lihat hasil asesmen',
            self::ResultsShare => 'Bagikan hasil asesmen',
            self::ResultsExport => 'Ekspor hasil asesmen',
            self::ActivityLogView => 'Lihat log aktivitas',
            self::EmailLogManage => 'Kelola log email',
            self::SettingsManage => 'Kelola pengaturan',
            self::RatersManageOwn => 'Kelola penilai sendiri',
            self::AssessmentFillSelf => 'Isi assessment sendiri',
            self::CompanyManage => 'Kelola company',
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
