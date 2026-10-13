import {
    Building2,
    CircleQuestionMark,
    FileBarChart2,
    Layers,
    LayoutGrid,
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
import { index as companiesIndex } from "@/routes/admin/companies";
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

    if (can.view_results) {
        assessmentItems.push({
            title: "Hasil Asesmen",
            href: "/admin/results",
            icon: FileBarChart2,
            exact: false,
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
                      {
                          title: "Perusahaan",
                          href: companiesIndex(),
                          icon: Building2,
                          exact: false,
                      },
                  ]
                : [],
        },
        { label: "Settings", items: logItems },
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
