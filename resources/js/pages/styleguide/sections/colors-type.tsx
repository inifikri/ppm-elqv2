import { Row, Section } from './section';

const TOKENS = [
    'background',
    'surface',
    'surface-elevated',
    'card',
    'muted',
    'accent',
    'primary',
    'success',
    'warning',
    'destructive',
    'info',
    'border',
    'ring',
];

export default function ColorsType() {
    return (
        <>
            <Section id="sg-colors" title="Warna (token semantik)">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {TOKENS.map((t) => (
                        <div key={t} className="space-y-1.5">
                            <div
                                className="h-12 rounded-md border"
                                style={{ background: `var(--color-${t})` }}
                            />
                            <p className="text-xs text-text-secondary">{t}</p>
                        </div>
                    ))}
                </div>
                <Row>
                    <span className="text-foreground">text-foreground</span>
                    <span className="text-text-secondary">text-secondary</span>
                    <span className="text-text-muted">text-muted</span>
                </Row>
            </Section>
            <Section id="sg-type" title="Tipografi (Inter)">
                <div className="space-y-2">
                    <p className="text-[28px] leading-tight font-semibold">
                        H1 28
                    </p>
                    <p className="text-xl font-semibold">H2 20</p>
                    <p className="text-lg font-semibold">H3 18</p>
                    <p className="text-sm">Body admin 14px</p>
                    <p className="text-base">Body assessment 16px</p>
                    <p className="text-xs text-text-muted">Small 12px</p>
                    <p className="tabular-nums">1234567890 (tabular-nums)</p>
                </div>
            </Section>
        </>
    );
}
