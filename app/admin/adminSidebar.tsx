"use client";

import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  HatGlassesIcon,
  FileText,
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
  roles: Roles[];
  title: string;
  url: string;
  icon: React.ElementType;
};

// Menu items.
const liveDataItems: MenuItem[] = [
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
    icon: Home,
  },
  {
    roles: ["admin"],
    title: "Phone Numbers",
    url: "/admin/phone-numbers",
    icon: Home,
  },
  {
    roles: ["admin", "customer"],
    title: "Agents",
    url: "/admin/agents",
    icon: HatGlassesIcon,
  },
  {
    roles: ["admin"],
    title: "Partners",
    url: "/admin/partners",
    icon: Inbox,
  },
  {
    roles: ["admin"],
    title: "Users",
    url: "/admin/users",
    icon: Inbox,
  },
  {
    roles: ["admin"],
    title: "Industries",
    url: "#",
    icon: Calendar,
  },
  {
    roles: ["admin"],
    title: "Functions",
    url: "#",
    icon: Calendar,
  },
  {
    roles: ["admin"],
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    roles: ["admin"],
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

// Menu items.
const partnerItems: MenuItem[] = [
  {
    roles: ["partner", "admin"],
    title: "Customers",
    url: "/admin/customers",
    icon: Home,
  },
  {
    roles: ["partner", "admin"],
    title: "Quotes",
    url: "/admin/quotes",
    icon: FileText,
  },
];

export default function AdminSidebar({
  email,
  admin,
  customer,
  partner,
}: {
  email?: string;
  admin?: boolean;
  customer?: boolean;
  partner?: boolean;
}) {
  const userRoles: Roles[] = [];
  if (admin) userRoles.push("admin");
  if (customer) userRoles.push("customer");
  if (partner) userRoles.push("partner");

  return (
    <Sidebar collapsible="icon" className="bg-cream">
      <SidebarHeader>
        <Image
          src="/logo.svg"
          alt="Logo"
          width={300}
          height={50}
          className="p-2"
        />
      </SidebarHeader>
      <SidebarContent>
        {!partner && (
          <SidebarGroup>
            <SidebarGroupLabel>Live Data</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {liveDataItems.map((item) => {
                  if (!item.roles.some((role) => userRoles.includes(role))) {
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
        )}
        {(partner || admin) && (
          <SidebarGroup>
            <SidebarGroupLabel>Sales</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {partnerItems.map((item) => {
                  if (!item.roles.some((role) => userRoles.includes(role))) {
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
        )}
        {admin && (
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
