<?php

return [
    // Kredensial awal admin untuk AdminUserSeeder (diisi lewat .env, jangan hardcode).
    'admin' => [
        'name' => env('ADMIN_NAME'),
        'email' => env('ADMIN_EMAIL'),
        'password' => env('ADMIN_PASSWORD'),
    ],

    'register' => [
        // Matikan di server on-premise tanpa DNS keluar: cek domain email dilewati.
        'dns_check' => env('REGISTER_EMAIL_DNS_CHECK', true),
        // Tolak password yang bocor (HIBP, butuh internet).
        'uncompromised' => env('REGISTER_PASSWORD_UNCOMPROMISED', false),
        // Form yang dikirim lebih cepat dari ini dianggap bot.
        'min_seconds' => 3,
        // Batas iterasi maksimum Proof-of-Work SHA-256 pada registrasi.
        'pow_max' => 15000,
    ],
];
