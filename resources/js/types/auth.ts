export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    can: {
        manage_users: boolean;
        manage_dimensions: boolean;
        manage_sub_dimensions: boolean;
        manage_questions: boolean;
        manage_company?: boolean;
        view_participants?: boolean;
        update_participants?: boolean;
        bulk_participants?: boolean;
        resend_raters?: boolean;
        revoke_raters?: boolean;
        view_results?: boolean;
        export_results?: boolean;
        share_results?: boolean;
        view_activity_log?: boolean;
        manage_email_logs?: boolean;
    };
};

export type MenuCounts = {
    dimensions: number | null;
    sub_dimensions: number | null;
    questions: number | null;
    participants?: number | null;
};
