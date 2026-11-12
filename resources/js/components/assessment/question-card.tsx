import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LikertScale } from './likert-scale';
import type { AssessmentQuestionItem } from '@/types/assessment';

export type QuestionCardProps = {
    question: AssessmentQuestionItem;
    questionNumber: number;
    selectedValue?: number | null;
    onChange: (value: number) => void;
    disabled?: boolean;
};

export function QuestionCard({
    question,
    questionNumber,
    selectedValue,
    onChange,
    disabled = false,
}: QuestionCardProps) {
    return (
        <Card className="border border-border/80 shadow-none">
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3 space-y-3">
                {/* Dimension & Sub-Dimension Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {question.dimension_name && (
                        <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary border-primary/20 text-[11px] font-semibold"
                        >
                            {question.dimension_name}
                        </Badge>
                    )}
                    {question.sub_dimension_name && (
                        <Badge
                            variant="outline"
                            className="text-[11px] text-muted-foreground font-medium"
                        >
                            {question.sub_dimension_name}
                        </Badge>
                    )}
                </div>

                {/* Question Statement */}
                <h2 className="text-base sm:text-lg font-semibold leading-relaxed text-foreground tracking-tight">
                    <span className="text-muted-foreground font-normal mr-1.5">
                        #{questionNumber}.
                    </span>
                    {question.text}
                </h2>
            </CardHeader>

            <CardContent className="p-4 pt-2 sm:p-6 sm:pt-3">
                <LikertScale
                    name={`q-${question.id}`}
                    value={selectedValue}
                    onChange={onChange}
                    disabled={disabled}
                />
            </CardContent>
        </Card>
    );
}
