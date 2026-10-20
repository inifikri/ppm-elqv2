<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id" style="color-scheme: light; supported-color-schemes: light;">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>@yield('title', 'ELQ 360° Assessment')</title>
    <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        @media only screen and (max-width: 600px) {
            .wrapper { width: 100% !important; padding: 12px 8px !important; }
            .container { width: 100% !important; border-radius: 12px !important; }
            .content-cell { padding: 24px 20px !important; }
            .header-cell { padding: 24px 20px 20px 20px !important; }
            .footer-cell { padding: 20px !important; }
            .btn-action { display: block !important; width: 100% !important; text-align: center !important; }
            .info-table td { display: block !important; width: 100% !important; padding: 4px 0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; color: #334155;">
    {{-- Hidden Preheader text for inbox preview --}}
    @hasSection('preheader')
        <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
            @yield('preheader')
            &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
        </div>
    @endif

    {{-- Main Outer Wrapper --}}
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" class="wrapper" style="background-color: #f8fafc; padding: 32px 16px; margin: 0;">
        <tr>
            <td align="center" valign="top">
                {{-- Centered Email Container --}}
                <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" class="container" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.04);">
                    {{-- Top Accent Line --}}
                    <tr>
                        <td height="4" style="background-color: #0284c7; line-height: 4px; font-size: 4px;">&nbsp;</td>
                    </tr>

                    {{-- Header Branding --}}
                    <tr>
                        <td class="header-cell" style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                <tr>
                                    <td>
                                        <div style="display: inline-block; vertical-align: middle;">
                                            <span style="font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                                ELQ <span style="color: #0284c7;">360°</span>
                                            </span>
                                            <span style="display: inline-block; margin-left: 8px; vertical-align: middle; background-color: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 9999px;">
                                                Assessment
                                            </span>
                                        </div>
                                        <div style="margin-top: 3px; font-size: 11px; color: #64748b; font-weight: 500; letter-spacing: -0.01em;">
                                            Executive Leadership Questionnaire
                                        </div>
                                    </td>
                                    @hasSection('header_extra')
                                        <td align="right" valign="middle">
                                            @yield('header_extra')
                                        </td>
                                    @endif
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Content Area --}}
                    <tr>
                        <td class="content-cell" style="padding: 32px 32px 36px 32px; font-size: 14px; line-height: 1.65; color: #334155;">
                            @yield('content')
                        </td>
                    </tr>

                    {{-- Footer Area --}}
                    <tr>
                        <td class="footer-cell" style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; line-height: 1.6; color: #94a3b8;">
                            <p style="margin: 0 0 6px 0; font-weight: 500; color: #64748b;">
                                Executive Leadership Questionnaire (ELQ) 360°
                            </p>
                            <p style="margin: 0 0 10px 0; color: #94a3b8;">
                                Email ini dibuat dan dikirimkan secara otomatis oleh sistem ELQ 360°. Harap tidak membalas email ini secara langsung.
                            </p>
                            <div style="font-size: 10px; color: #cbd5e1; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                                &copy; {{ date('Y') }} PPM Manajemen &bull; Hak Cipta Dilindungi Undang-Undang
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
