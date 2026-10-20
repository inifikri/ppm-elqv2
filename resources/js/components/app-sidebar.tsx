import {
    Building2,
    CircleQuestionMark,
    History,
    Layers,
    LayoutGrid,
    Mail,
    Network,
    Users,
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import AppLogo from "@/components/app-logo";
import { NavMain } from "@/components/nav-main";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { dashboard } from "@/routes";
import { index as activityLogsIndex } from "@/routes/admin/activity-logs";
import { index as companiesIndex } from "@/routes/admin/companies";
import { index as emailLogsIndex } from "@/routes/admin/email-logs";
import { index as domainsIndex } from "@/routes/admin/domains";
import { index as questionsIndex } from "@/routes/admin/questions";
import { index as subDomainsIndex } from "@/routes/admin/sub-domains";
import { index as usersIndex } from "@/routes/admin/users";
import type { NavGroup } from "@/types";

const toBadge = (count: number | null | undefined, label: string) =>
    typeof count === "number" ? { count, label } : null;

export function AppSidebar() {
    const { auth, menuCounts } = usePage().props;

    const { can } = auth;
    const assessmentItems: NavGroup["items"] = [];
    const masterItems: NavGroup["items"] = [];
    const logItems: NavGroup["items"] = [];

    if (can.view_participants) {
        assessmentItems.push({
            title: "Peserta",
            href: "/admin/participants",
            icon: Users,
            exact: false,
            badge: toBadge(menuCounts?.participants, "peserta"),
        });
    }

    if (can.manage_dimensions) {
        masterItems.push({
            title: "Dimensi",
            href: domainsIndex(),
            icon: Layers,
            exact: false,
            badge: toBadge(menuCounts?.dimensions, "dimensi"),
        });
    }

    if (can.manage_sub_dimensions) {
        masterItems.push({
            title: "Sub Dimensi",
            href: subDomainsIndex(),
            icon: Network,
            exact: false,
            badge: toBadge(menuCounts?.sub_dimensions, "sub dimensi"),
        });
    }

    if (can.manage_questions) {
        masterItems.push({
            title: "Pertanyaan",
            href: questionsIndex(),
            icon: CircleQuestionMark,
            exact: false,
            badge: toBadge(menuCounts?.questions, "pertanyaan"),
        });
    }

    if (can.manage_company ?? can.manage_users) {
        masterItems.push({
            title: "Perusahaan",
            href: companiesIndex(),
            icon: Building2,
            exact: false,
        });
    }

    if (can.view_activity_log) {
        logItems.push({
            title: "Activity Log",
            href: activityLogsIndex(),
            icon: History,
            exact: false,
        });
    }

    if (can.manage_email_logs) {
        logItems.push({
            title: "Email Log",
            href: emailLogsIndex(),
            icon: Mail,
            exact: false,
        });
    }

    const groups: NavGroup[] = [
        {
            label: "Menu",
            items: [
                {
                    title: "Dashboard",
                    href: dashboard(),
                    icon: LayoutGrid,
                },
            ],
        },
        { label: "Asesmen", items: assessmentItems },
        { label: "Master Data", items: masterItems },
        {
            label: "Administrasi",
            items: can.manage_users
                ? [
                      {
                          title: "Pengguna",
                          href: usersIndex(),
                          icon: Users,
                          exact: false,
                      },
                  ]
                : [],
        },
        { label: "Sistem", items: logItems },
    ].filter((g) => g.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={groups} />
            </SidebarContent>
        </Sidebar>
    );
}
