<?php

namespace App\Enums;

enum RaterRole: string
{
    // 'Self' adalah kata cadangan PHP, maka case diberi nama SelfRater.
    case SelfRater = 'self';
    case Boss = 'boss';
    case Subordinate = 'subordinate';

    public function label(): string
    {
        return match ($this) {
            self::SelfRater => 'Diri sendiri',
            self::Boss => 'Atasan',
            self::Subordinate => 'Bawahan',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
