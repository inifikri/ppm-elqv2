import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { PermissionGroup } from '@/types';

export default function PermissionCheckboxes({
    groups,
    role,
    checked,
}: {
    groups: PermissionGroup[];
    role: 'admin' | 'participant';
    checked: string[];
}) {
    const isAdmin = role === 'admin';
    const visible = isAdmin
        ? groups
        : groups.filter((g) => g.group === 'Assessment');

    return (
        <fieldset className="space-y-4">
            <legend className="text-sm font-medium">Izin tambahan</legend>
            {isAdmin && (
                <p className="text-sm text-muted-foreground">
                    Administrator memiliki seluruh hak akses
                </p>
            )}
            {visible.map((g) => (
                <div key={g.group} className="space-y-2">
                    <p className="text-sm text-muted-foreground">{g.group}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {g.permissions.map((p) => (
                            <div
                                key={p.name}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    id={`perm-${p.name}`}
                                    name={isAdmin ? undefined : 'permissions[]'}
                                    value={p.name}
                                    defaultChecked={
                                        isAdmin || checked.includes(p.name)
                                    }
                                    disabled={isAdmin}
                                />
                                <Label htmlFor={`perm-${p.name}`}>
                                    {p.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </fieldset>
    );
}
