export type AttentionDetailItem = {
    id: number;
    participant_id?: number | null;
    participant_name: string;
    company: string;
    position?: string;
    rater_role?: string;
    rater_email?: string;
    email?: string;
    days_pending?: number;
    error_message?: string;
    recipient_email?: string;
    detail_url?: string | null;
};

export type AttentionItem = {
    key: string;
    label: string;
    count: number;
    tone: 'danger' | 'warning' | 'info';
    details?: AttentionDetailItem[];
};

export type DashboardData = {
    kpi: {
        active: number;
        not_started: number;
        in_progress: number;
        completed: number;
        completion_rate: number;
    };
    roles: { role: string; label: string; submitted: number; total: number }[];
    dimensions: {
        id: number;
        name: string;
        average: number;
        answers: number;
    }[];
    recent_assessments: {
        id: number;
        participant: string;
        role: string;
        submitted_at: string;
    }[];
    recent_activity: {
        id: number;
        actor: string;
        description: string;
        subject: string;
        at: string;
    }[];
    attention: AttentionItem[];
};
