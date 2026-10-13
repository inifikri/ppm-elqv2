import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { UserCheck, Users } from 'lucide-react';

export type EvaluatorCardProps = {
    role: 'boss' | 'subordinate';
    index?: number;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
};

export function EvaluatorCard({
    role,
    index = 1,
    value,
    onChange,
    error,
    disabled = false,
}: EvaluatorCardProps) {
    const isBoss = role === 'boss';
    const inputId = isBoss ? 'evaluator-boss-email' : `evaluator-sub-${index}-email`;
    const errorId = `${inputId}-error`;

    const title = isBoss ? 'Atasan Langsung' : `Bawahan ${index}`;
    const badgeText = isBoss ? 'Atasan (1/1)' : `Bawahan (${index}/3)`;
    const hint = isBoss
        ? 'Atasan yang mengamati dan mengevaluasi kinerja kepemimpinan Anda secara langsung.'
        : `Anggota tim/staf yang berada di bawah supervisi atau koordinasi langsung Anda.`;

    return (
        <Card className="shadow-none border border-border/80 transition-colors focus-within:border-primary/50">
            <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            {isBoss ? <UserCheck className="size-4" /> : <Users className="size-4" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                            <p className="text-xs text-muted-foreground">{hint}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium shrink-0">
                        {badgeText}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
                <div className="space-y-1.5">
                    <Label htmlFor={inputId} className="text-xs font-medium">
                        Alamat Email {isBoss ? 'Atasan' : `Bawahan ${index}`} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id={inputId}
                        type="email"
                        placeholder="contoh: nama.rekan@perusahaan.com"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                        className="h-10 text-sm"
                    />
                    {error && (
                        <p id={errorId} className="text-xs font-medium text-destructive">
                            {error}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
