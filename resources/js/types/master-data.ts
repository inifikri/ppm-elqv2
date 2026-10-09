export type Domain = {
    id: number;
    name: string;
    sort_order: number;
    is_active: boolean;
    sub_domains_count: number | null;
};

export type DomainDetail = Domain & {
    sub_domains: {
        id: number;
        name: string;
        questions: { id: number; text: string }[];
    }[];
};

export type SubDomain = {
    id: number;
    dimension_id: number;
    domain: string | null;
    name: string;
    sort_order: number;
    questions_count: number | null;
};

export type QuestionRow = {
    id: number;
    sub_dimension_id: number;
    sub_domain: string | null;
    domain: string | null;
    text: string;
    text_plain: string;
    sort_order: number;
};

export type Company = {
    id: number;
    name: string;
    participants_count: number | null;
};

export type DomainOption = { id: number; name: string };

export type SubDomainOption = DomainOption & { domain: string };

export type MasterFilters = {
    search: string;
    dimension_id: number | null;
};
