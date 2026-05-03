"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

interface JsonSchemaDataViewerProps {
  data: unknown;
  schema: unknown;
}

type SchemaObject = Record<string, unknown>;

function isSchemaObject(value: unknown): value is SchemaObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
}

function getSchemaForProperty(schema: unknown, key: string) {
  if (!isSchemaObject(schema)) {
    return null;
  }

  if (isSchemaObject(schema.properties) && key in schema.properties) {
    return schema.properties[key];
  }

  if (schema.additionalProperties === false) {
    return null;
  }

  return schema.additionalProperties;
}

function getArrayItemSchema(schema: unknown) {
  if (!isSchemaObject(schema)) {
    return null;
  }

  return schema.items ?? null;
}

function getSchemaLabel(schema: unknown, key?: string) {
  if (isSchemaObject(schema) && typeof schema.title === "string") {
    return schema.title;
  }

  if (key) {
    return humanizeKey(key);
  }

  return "Value";
}

function getSchemaDescription(schema: unknown) {
  return isSchemaObject(schema) && typeof schema.description === "string"
    ? schema.description
    : null;
}

function getSchemaType(schema: unknown) {
  if (!isSchemaObject(schema)) {
    return null;
  }

  if (typeof schema.type === "string") {
    return schema.type;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.join(" | ");
  }

  return null;
}

function ValueSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border/70 bg-muted/30 px-3 py-2 font-mono text-sm text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

function renderPrimitiveValue(value: unknown) {
  if (value === null) {
    return <ValueSurface>Null</ValueSurface>;
  }

  if (typeof value === "boolean") {
    return <ValueSurface>{value ? "true" : "false"}</ValueSurface>;
  }

  if (typeof value === "number") {
    return <ValueSurface>{String(value)}</ValueSurface>;
  }

  if (typeof value === "string") {
    return (
      <ValueSurface className="break-words whitespace-pre-wrap">
        {value}
      </ValueSurface>
    );
  }

  return (
    <ValueSurface className="break-all whitespace-pre-wrap">
      {JSON.stringify(value, null, 2)}
    </ValueSurface>
  );
}

function SchemaFieldHeader({
  fieldKey,
  schema,
  compact = false,
}: {
  fieldKey?: string;
  schema: unknown;
  compact?: boolean;
}) {
  const label = getSchemaLabel(schema, fieldKey);
  const description = getSchemaDescription(schema);
  const schemaType = getSchemaType(schema);

  return (
    <div className={cn("space-y-1", compact && "space-y-0.5")}>
      <div className="flex flex-wrap items-center gap-2">
        <h4
          className={cn("font-medium text-foreground", !compact && "text-lg")}
        >
          {label}
        </h4>
        {fieldKey && (
          <Badge
            variant="secondary"
            className="font-mono text-[10px] tracking-wide"
          >
            key: {fieldKey}
          </Badge>
        )}
        {schemaType && (
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wide"
          >
            {schemaType}
          </Badge>
        )}
      </div>
      {!!description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function ComplexSchemaField({
  data,
  schema,
  fieldKey,
  depth,
}: {
  data: unknown;
  schema: unknown;
  fieldKey: string;
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const fieldCount = Array.isArray(data)
    ? data.length
    : isSchemaObject(data)
      ? Object.keys(data).length
      : 0;
  const fieldCountLabel = Array.isArray(data)
    ? `${fieldCount} Items`
    : `${fieldCount} Fields`;

  return (
    <div className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
      <SchemaFieldHeader
        fieldKey={fieldKey}
        schema={schema}
        compact={depth > 0}
      />
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="rounded-lg border border-border/70 bg-muted/10 transition-colors">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between gap-3 p-4 text-left">
              <p className="text-sm font-medium text-foreground">
                {fieldCountLabel}
              </p>
              {isOpen ? (
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border/70 bg-background/80 p-4">
              <SchemaValue
                data={data}
                schema={schema}
                depth={depth + 1}
                showHeader={false}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

function SchemaValue({
  data,
  schema,
  fieldKey,
  depth,
  showHeader = true,
}: {
  data: unknown;
  schema: unknown;
  fieldKey?: string;
  depth: number;
  showHeader?: boolean;
}) {
  if (Array.isArray(data)) {
    const itemSchema = getArrayItemSchema(schema);
    const arrayLabel = getSchemaLabel(schema, fieldKey);

    return (
      <Card
        className={cn(
          depth > 0 && "shadow-none",
          !showHeader && "gap-0 border-0 bg-transparent p-0 shadow-none",
        )}
      >
        {showHeader && (
          <CardHeader>
            <SchemaFieldHeader
              fieldKey={fieldKey}
              schema={schema}
              compact={depth > 0}
            />
          </CardHeader>
        )}
        <CardContent>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items</p>
          ) : (
            <div className="space-y-3">
              {data.every(
                (item) =>
                  item === null ||
                  ["string", "number", "boolean"].includes(typeof item),
              ) ? (
                <ValueSurface className="flex flex-wrap gap-2 whitespace-pre-wrap">
                  {data.map((item, index) => (
                    <span
                      key={`${fieldKey || "item"}-${index}`}
                      className="rounded border border-border/60 bg-background/80 px-2 py-1"
                    >
                      {item === null ? "Null" : String(item)}
                    </span>
                  ))}
                </ValueSurface>
              ) : (
                data.map((item, index) => (
                  <ComplexSchemaField
                    key={`${fieldKey || "item"}-${index}`}
                    data={item}
                    schema={itemSchema}
                    fieldKey={`${arrayLabel} Item ${index + 1}`}
                    depth={depth}
                  />
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isSchemaObject(data)) {
    const entries = Object.entries(data);

    return (
      <Card
        className={cn(
          depth > 0 && "shadow-none",
          !showHeader && "gap-0 border-0 bg-transparent p-0 shadow-none",
        )}
      >
        {showHeader && (
          <CardHeader>
            <SchemaFieldHeader
              fieldKey={fieldKey}
              schema={schema}
              compact={depth > 0}
            />
          </CardHeader>
        )}
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No values</p>
          ) : (
            <div className="space-y-4">
              {entries.map(([key, value]) => {
                const propertySchema = getSchemaForProperty(schema, key);
                const isComplex = Array.isArray(value) || isSchemaObject(value);

                if (isComplex) {
                  return (
                    <ComplexSchemaField
                      key={key}
                      data={value}
                      schema={propertySchema}
                      fieldKey={key}
                      depth={depth}
                    />
                  );
                }

                return (
                  <div
                    key={key}
                    className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0"
                  >
                    <SchemaFieldHeader
                      fieldKey={key}
                      schema={propertySchema}
                      compact={depth > 0}
                    />
                    <div>{renderPrimitiveValue(value)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        depth > 0 && "shadow-none",
        !showHeader && "gap-0 border-0 bg-transparent p-0 shadow-none",
      )}
    >
      {showHeader && (
        <CardHeader>
          <SchemaFieldHeader
            fieldKey={fieldKey}
            schema={schema}
            compact={depth > 0}
          />
        </CardHeader>
      )}
      <CardContent>{renderPrimitiveValue(data)}</CardContent>
    </Card>
  );
}

export default function JsonSchemaDataViewer({
  data,
  schema,
}: JsonSchemaDataViewerProps) {
  return <SchemaValue data={data} schema={schema} depth={0} />;
}
