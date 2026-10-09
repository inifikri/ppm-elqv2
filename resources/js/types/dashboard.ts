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
    attention: {
        key: string;
        label: string;
        count: number;
        tone: 'danger' | 'warning' | 'info';
    }[];
};
