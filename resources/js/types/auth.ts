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
    };
};

export type MenuCounts = {
    dimensions: number | null;
    sub_dimensions: number | null;
    questions: number | null;
};
