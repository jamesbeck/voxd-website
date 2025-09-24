import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";

// Menu items.
const items = [
  {
    title: "Admin Home",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Agents",
    url: "/admin/agents",
    icon: Inbox,
  },
  {
    title: "Industries",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Functions",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Core</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Examples</SidebarGroupLabel>
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
      </SidebarContent>
    </Sidebar>
  );
}
