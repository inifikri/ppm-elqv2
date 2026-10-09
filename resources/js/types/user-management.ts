export type ManagedUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    is_active: boolean;
    role: 'admin' | 'participant' | null;
    company: string | null;
    position: string | null;
    email_verified: boolean;
    can_delete: boolean;
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
    email_verified_at: string | null;
    last_login_at: string | null;
    created_at: string | null;
};
