/** Cermin aturan server (PasswordValidationRules::passwordRule): min 8, huruf besar + kecil, angka. */
export const PASSWORD_MIN = 8;

export const passwordRules = [
    {
        id: 'length',
        label: `Minimal ${PASSWORD_MIN} karakter`,
        test: (v: string) => v.length >= PASSWORD_MIN,
    },
    {
        id: 'upper',
        label: 'Huruf besar (A-Z)',
        test: (v: string) => /\p{Lu}/u.test(v),
    },
    {
        id: 'lower',
        label: 'Huruf kecil (a-z)',
        test: (v: string) => /\p{Ll}/u.test(v),
    },
    { id: 'number', label: 'Angka (0-9)', test: (v: string) => /\d/.test(v) },
] as const;

export const isPasswordValid = (v: string) =>
    passwordRules.every((r) => r.test(v));

/** 0-4: jumlah aturan terpenuhi; level 4 hanya tercapai bila semua aturan terpenuhi. */
export const passwordStrength = (v: string) =>
    passwordRules.filter((r) => r.test(v)).length;

export const strengthLabels = [
    'Sangat lemah',
    'Lemah',
    'Cukup',
    'Hampir kuat',
    'Kuat',
];
