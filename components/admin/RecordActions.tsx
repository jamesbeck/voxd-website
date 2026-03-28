"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import Alert from "@/components/admin/Alert";
import { MoreHorizontalIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionButton = {
  label?: string;
  icon?: ReactNode;
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm" | "icon" | "icon-sm";
  onClick?: () => void;
  href?: string;
  target?: string;
  tooltip?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  confirm?: {
    title: string;
    description: string;
    actionText: string;
    destructive?: boolean;
  };
};

export type ActionButtonGroup = {
  buttons: ActionButton[];
};

export type DropdownItem = {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onSelect?: () => void;
  href?: string;
  target?: string;
  loading?: boolean;
  disabled?: boolean;
  confirm?: {
    title: string;
    description: string;
    actionText: string;
    destructive?: boolean;
    onAction: () => void;
  };
  /** Escape hatch: render an arbitrary element instead of the standard item */
  element?: ReactNode;
};

export type DropdownGroup = {
  label?: string;
  items: DropdownItem[];
};

export type RecordActionsProps = {
  /** Arbitrary elements rendered first (leftmost) */
  custom?: ReactNode;
  /** Single buttons or button groups rendered after custom slot */
  buttons?: (ActionButton | ActionButtonGroup)[];
  /** Single ellipsis dropdown rendered last (rightmost) */
  dropdown?: {
    groups: DropdownGroup[];
    loading?: boolean;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isButtonGroup(
  item: ActionButton | ActionButtonGroup,
): item is ActionButtonGroup {
  return "buttons" in item;
}

function renderSingleButton(btn: ActionButton, key: string | number) {
  const size = btn.size ?? (btn.label ? "sm" : "icon-sm");
  const content = (
    <>
      {btn.loading ? <Spinner /> : btn.icon}
      {btn.label}
    </>
  );

  let buttonEl: ReactNode;

  if (btn.href) {
    buttonEl = (
      <Button
        key={key}
        variant={btn.variant ?? "outline"}
        size={size}
        className={btn.className}
        disabled={btn.disabled}
        asChild
      >
        <Link href={btn.href} target={btn.target}>
          {content}
        </Link>
      </Button>
    );
  } else {
    buttonEl = (
      <Button
        key={key}
        variant={btn.variant ?? "outline"}
        size={size}
        className={btn.className}
        disabled={btn.disabled || btn.loading}
        onClick={btn.confirm ? undefined : btn.onClick}
      >
        {content}
      </Button>
    );
  }

  if (btn.confirm) {
    buttonEl = (
      <Alert
        key={key}
        title={btn.confirm.title}
        description={btn.confirm.description}
        actionText={btn.confirm.actionText}
        destructive={btn.confirm.destructive}
        onAction={btn.onClick!}
      >
        {buttonEl as React.ReactElement}
      </Alert>
    );
  }

  if (btn.tooltip) {
    return (
      <Tooltip key={key}>
        <TooltipTrigger asChild>{buttonEl}</TooltipTrigger>
        <TooltipContent>{btn.tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return buttonEl;
}

function renderDropdownItem(item: DropdownItem, key: string | number) {
  if (item.element) return <span key={key}>{item.element}</span>;

  const icon = item.loading ? <Spinner /> : item.icon;

  if (item.href) {
    return (
      <DropdownMenuItem key={key} asChild>
        <Link href={item.href} target={item.target}>
          {icon}
          {item.label}
        </Link>
      </DropdownMenuItem>
    );
  }

  const menuItem = (
    <DropdownMenuItem
      key={key}
      variant={item.danger ? "destructive" : "default"}
      disabled={item.disabled || item.loading}
      onSelect={item.confirm ? (e) => e.preventDefault() : item.onSelect}
    >
      {icon}
      {item.label}
    </DropdownMenuItem>
  );

  if (item.confirm) {
    return (
      <Alert
        key={key}
        title={item.confirm.title}
        description={item.confirm.description}
        actionText={item.confirm.actionText}
        destructive={item.confirm.destructive}
        onAction={item.confirm.onAction}
      >
        {menuItem}
      </Alert>
    );
  }

  return menuItem;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RecordActions({
  custom,
  buttons,
  dropdown,
}: RecordActionsProps) {
  return (
    <TooltipProvider>
      {custom}

      {buttons?.map((item, i) => {
        if (isButtonGroup(item)) {
          return (
            <ButtonGroup key={i}>
              {item.buttons.map((btn, j) => renderSingleButton(btn, `${i}-${j}`))}
            </ButtonGroup>
          );
        }
        return renderSingleButton(item, i);
      })}

      {dropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm">
              {dropdown.loading ? <Spinner /> : <MoreHorizontalIcon />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {dropdown.groups.map((group, gi) => (
              <span key={gi}>
                {gi > 0 && <DropdownMenuSeparator />}
                {group.label && (
                  <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                )}
                <DropdownMenuGroup>
                  {group.items.map((item, ii) =>
                    renderDropdownItem(item, `${gi}-${ii}`),
                  )}
                </DropdownMenuGroup>
              </span>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </TooltipProvider>
  );
}
