import { ReactNode } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type RecordTab = {
  value: string;
  label: ReactNode;
  href?: string;
};

type RecordTabsProps = {
  tabs: RecordTab[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
} & (
  | { value: string; defaultValue?: never }
  | { defaultValue: string; value?: never }
);

export default function RecordTabs({
  tabs,
  actions,
  children,
  className,
  ...tabProps
}: RecordTabsProps) {
  return (
    <Tabs className={cn("space-y-2", className)} {...tabProps}>
      <div className="flex flex-wrap items-center gap-2 mb-2 min-w-0">
        <div className="overflow-x-auto scrollbar-hide min-w-0">
          <TabsList>
            {tabs.map((tab) =>
              tab.href ? (
                <TabsTrigger key={tab.value} value={tab.value} asChild>
                  <Link href={tab.href}>{tab.label}</Link>
                </TabsTrigger>
              ) : (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ),
            )}
          </TabsList>
        </div>

        {actions && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {actions}
          </div>
        )}
      </div>

      <div className="border-b mb-6" />

      {children}
    </Tabs>
  );
}
