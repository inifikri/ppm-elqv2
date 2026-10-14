export type ParticipantInfo = {
    id: number;
    name: string;
    email: string;
    company?: string | null;
    position?: string | null;
};

export type RoleRaterStatus = {
    submitted: number;
    total: number;
    is_complete: boolean;
};

export type AnsweredRaters = {
    self: RoleRaterStatus;
    boss: RoleRaterStatus;
    subordinate: RoleRaterStatus;
    total_submitted: number;
    total_raters: number;
    is_all_complete: boolean;
};

export type RoleScores = {
    self: number | null;
    boss: number | null;
    subordinate: number | null;
    average: number | null;
};

export type SubDimensionScore = {
    id: number;
    name: string;
    sort_order: number;
    scores: RoleScores;
};

export type DimensionScore = {
    id: number;
    name: string;
    sort_order: number;
    scores: RoleScores;
    sub_dimensions: SubDimensionScore[];
};

export type AssessmentResult = {
    has_data: boolean;
    participant: ParticipantInfo;
    answered_raters: AnsweredRaters;
    overall_score: number | null;
    role_overall_scores: {
        self: number | null;
        boss: number | null;
        subordinate: number | null;
    };
    dimensions: DimensionScore[];
};

export type DetailedAnswerItem = {
    id: number;
    text: string;
    dimension_id: number;
    dimension_name: string;
    sub_dimension_id: number;
    sub_dimension_name: string;
    self_score: number | null;
    boss_score: number | null;
    subordinate_score: number | null;
    average: number | null;
};

export type DetailedAnswersResponse = {
    data: DetailedAnswerItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type ParticipantResultSummary = {
    id: number;
    name: string;
    email: string;
    company: string | null | undefined;
    position: string | null | undefined;
    raters_status: {
        self: boolean;
        boss: boolean;
        subordinate: {
            submitted: number;
            total: number;
        };
        total_submitted: number;
        total_raters: number;
    };
    is_completed: boolean;
    has_data: boolean;
};

export type AssessmentQuestionItem = {
    id: number;
    text: string;
    sort_order: number;
    sub_dimension_name?: string | null;
    dimension_name?: string | null;
};

export type ParticipantDashboardEvaluator = {
    email: string;
    is_submitted: boolean;
    submitted_at: string | null;
    email_status: 'queued' | 'sent' | 'failed' | string;
};

export type ParticipantDashboardData = {
    participant: {
        name: string;
        email: string;
        company?: string | null;
        position?: string | null;
    };
    self_assessment: {
        is_submitted: boolean;
        submitted_at: string | null;
        total_questions?: number;
    };
    evaluators: {
        boss: ParticipantDashboardEvaluator | null;
        subordinates: ParticipantDashboardEvaluator[];
        total_invited: number;
        total_submitted: number;
    };
};

