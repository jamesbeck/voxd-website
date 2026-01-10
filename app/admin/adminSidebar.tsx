"use client";

import {
  Home,
  Inbox,
  Smartphone,
  FileText,
  Phone,
  BotMessageSquare,
  Building,
  Handshake,
  User,
  UserCog,
  MessageCircle,
  HelpCircle,
  FolderOpen,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Collapsible } from "@radix-ui/react-collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUp, User2 } from "lucide-react";
import logout from "@/actions/saLogout";
import { Roles } from "@/types/types";

type MenuItem = {
  roles?: Roles[];
  title: string;
  url: string;
  icon: React.ElementType;
};

// Menu items.
const menuItems: MenuItem[] = [
  {
    roles: ["admin"],
    title: "Admin Home",
    url: "/admin",
    icon: Home,
  },
  {
    roles: ["admin"],
    title: "WABAs",
    url: "/admin/wabas",
    icon: Smartphone,
  },
  {
    roles: ["admin"],
    title: "Phone Numbers",
    url: "/admin/phone-numbers",
    icon: Phone,
  },
  {
    roles: ["admin", "partner"],
    title: "Organisations",
    url: "/admin/organisations",
    icon: Building,
  },
  {
    roles: ["partner", "admin"],
    title: "Quotes",
    url: "/admin/quotes",
    icon: FileText,
  },
  {
    title: "Agents",
    url: "/admin/agents",
    icon: BotMessageSquare,
  },
  {
    title: "Sessions",
    url: "/admin/sessions",
    icon: MessageCircle,
  },
  {
    roles: ["admin"],
    title: "Partners",
    url: "/admin/partners",
    icon: Handshake,
  },
  {
    title: "Chat Users",
    url: "/admin/chatUsers",
    icon: User,
  },
  {
    title: "FAQ",
    url: "/admin/faq",
    icon: HelpCircle,
  },
  {
    roles: ["admin"],
    title: "FAQ Categories",
    url: "/admin/faq-categories",
    icon: FolderOpen,
  },
  {
    roles: ["admin", "organisation"],
    title: "Admin Users",
    url: "/admin/adminUsers",
    icon: UserCog,
  },
  {
    roles: ["admin"],
    title: "Activity Log",
    url: "/admin/log",
    icon: ScrollText,
  },
];

export default function AdminSidebar({
  email,
  superAdmin,
  partner,
  logoUrl,
}: {
  email?: string;
  superAdmin?: boolean;
  partner?: boolean;
  logoUrl?: string;
}) {
  const userRoles: Roles[] = [];
  if (superAdmin) userRoles.push("admin");
  if (partner) userRoles.push("partner");
  if (!superAdmin && !partner) userRoles.push("organisation");

  return (
    <Sidebar collapsible="icon" className="bg-cream">
      <SidebarHeader>
        <Image
          src={logoUrl || "/logo.svg"}
          alt="Logo"
          width={300}
          height={50}
          unoptimized
          className="p-2"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Live Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (
                  item.roles &&
                  !item.roles.some((role) => userRoles.includes(role))
                ) {
                  return null;
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {superAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>CMS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/admin/industries">
                      <Inbox />
                      <span>Industries</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/admin/functions">
                      <Inbox />
                      <span>Functions</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <Collapsible defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/admin/examples">
                        <Inbox />
                        <span>Examples</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      <SidebarMenuButton asChild>
                        <Link href="/admin/examples/generate">
                          <Inbox />
                          <span>Generate Example</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {email}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={() => logout()}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
