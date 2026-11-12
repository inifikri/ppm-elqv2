import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { PermissionGroup } from '@/types';
import type { UserRoleType } from '@/types/user-management';

export default function PermissionCheckboxes({
    groups,
    role,
    checked,
}: {
    groups: PermissionGroup[];
    role: UserRoleType;
    checked: string[];
}) {
    const isSuperAdmin = role === 'superadmin';
    const isAdmin = role === 'admin';
    const isFullAccess = isSuperAdmin || isAdmin;

    // Filter grup yang relevan berdasarkan role
    const visible = isSuperAdmin
        ? groups
        : isAdmin
          ? groups.filter((g) => g.group !== 'Pengguna' && g.group !== 'Sistem')
          : groups.filter((g) => g.group === 'Assessment');

    return (
        <fieldset className="space-y-4">
            <legend className="text-sm font-medium">Izin tambahan</legend>
            {isSuperAdmin && (
                <p className="text-sm text-muted-foreground">
                    Super Admin memiliki seluruh hak akses sistem secara penuh.
                </p>
            )}
            {isAdmin && (
                <p className="text-sm text-muted-foreground">
                    Administrator memiliki hak akses operasional asesmen secara penuh.
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
                                    name={isFullAccess ? undefined : 'permissions[]'}
                                    value={p.name}
                                    defaultChecked={
                                        isFullAccess || checked.includes(p.name)
                                    }
                                    disabled={isFullAccess}
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
