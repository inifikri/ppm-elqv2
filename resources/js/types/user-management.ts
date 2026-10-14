export type ManagedUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar?: string | null;
    is_active: boolean;
    role: 'admin' | 'participant' | null;
    company?: string | null;
    position?: string | null;
    email_verified: boolean;
    can_delete: boolean;
    is_trashed?: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type PermissionGroup = {
    group: string;
    permissions: { name: string; label: string }[];
};

export type UserFilters = {
    search: string;
    role?: string;
    status?: string;
    tab?: string;
};

export type EditableUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    role: 'admin' | 'participant' | null;
    avatar: string | null;
    company_name: string | null;
    position: string | null;
    is_self: boolean;
};

export type UserActivity = {
    id: number;
    description: string;
    log_name: string;
    causer_name: string;
    created_at: string | null;
};

export type UserDetail = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    is_active: boolean;
    role: 'admin' | 'participant' | null;
    company: string | null;
    position: string | null;
    email_verified?: boolean;
    email_verified_at: string | null;
    last_login_at: string | null;
    created_at: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    is_trashed?: boolean;
    can_delete?: boolean;
    is_self?: boolean;
    activities?: UserActivity[];
};

export type ParticipantProgress = {
    self: boolean;
    boss: boolean;
    subordinate: {
        submitted: number;
        total: number;
    };
    total_submitted: number;
    total_raters: number;
    is_completed: boolean;
    has_started: boolean;
};

export type ParticipantListItem = {
    id: number;
    name: string;
    email: string;
    company: string;
    position: string;
    is_active: boolean;
    email_verified?: boolean;
    is_trashed?: boolean;
    updated_at: string;
    progress: ParticipantProgress;
};

export type ParticipantRaterItem = {
    id: number;
    ulid: string;
    role: string;
    role_label: string;
    email: string | null;
    submitted_at: string | null;
    is_submitted: boolean;
    invitation_status: string;
    invitation_sent_at: string | null;
};

export type ParticipantDetail = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    company_name: string;
    position: string;
    is_active: boolean;
    is_trashed?: boolean;
    can_delete?: boolean;
    created_at: string;
    updated_at: string;
    has_results: boolean;
};
