import { CheckCircle2, Clock, Users, User, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AssessmentResult } from '@/types/assessment';

export function ScoreCard({ result }: { result: AssessmentResult }) {
    const { answered_raters, overall_score, role_overall_scores } = result;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Skor Keseluruhan */}
            <Card className="md:col-span-1 shadow-xs border-primary/20 bg-linear-to-br from-card to-primary/5">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Skor Keseluruhan
                        </CardTitle>
                        {answered_raters.is_all_complete ? (
                            <Badge variant="default" className="bg-emerald-600 text-white">
                                Lengkap
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="text-amber-600 dark:text-amber-400">
                                Belum Lengkap
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
                            {overall_score !== null ? overall_score.toFixed(2) : '-'}
                        </span>
                        <span className="text-sm text-muted-foreground">/ 6.00</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Rata-rata tertimbang role penilai yang telah mengisi.
                    </p>
                </CardContent>
            </Card>

            {/* Diri Sendiri */}
            <Card className="shadow-xs">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <User className="size-4 text-indigo-500" />
                            Diri Sendiri
                        </span>
                        {answered_raters.self.is_complete ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                            <Clock className="size-4 text-amber-500" />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="text-2xl font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                        {role_overall_scores.self !== null ? role_overall_scores.self.toFixed(2) : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Status: {answered_raters.self.submitted} dari {answered_raters.self.total} submit
                    </p>
                </CardContent>
            </Card>

            {/* Atasan */}
            <Card className="shadow-xs">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <ShieldCheck className="size-4 text-emerald-500" />
                            Atasan (Boss)
                        </span>
                        {answered_raters.boss.is_complete ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                            <Clock className="size-4 text-amber-500" />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {role_overall_scores.boss !== null ? role_overall_scores.boss.toFixed(2) : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Status: {answered_raters.boss.submitted} dari {answered_raters.boss.total} submit
                    </p>
                </CardContent>
            </Card>

            {/* Bawahan */}
            <Card className="shadow-xs">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <Users className="size-4 text-amber-500" />
                            Bawahan (Subordinate)
                        </span>
                        {answered_raters.subordinate.is_complete ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                            <Clock className="size-4 text-amber-500" />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                        {role_overall_scores.subordinate !== null ? role_overall_scores.subordinate.toFixed(2) : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Status: {answered_raters.subordinate.submitted} dari {answered_raters.subordinate.total} submit
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
