"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import saUpdateQuotePricing from "@/actions/saUpdateQuotePricing";
import saGenerateQuoteCosting from "@/actions/saGenerateQuoteCosting";
import { CostingBreakdown } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, ChevronRight, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  setupFee: z.string(),
  monthlyFee: z.string(),
  hourlyRate: z.string(),
  contractNotes: z.string(),
  setupFeeVoxdCost: z.string(),
  monthlyFeeVoxdCost: z.string(),
  buildDays: z.string(),
  freeMonthlyMinutes: z.string(),
  contractLength: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditPricingForm({
  quoteId,
  setupFee,
  monthlyFee,
  hourlyRate,
  contractNotes,
  setupFeeVoxdCost,
  monthlyFeeVoxdCost,
  buildDays,
  freeMonthlyMinutes,
  contractLength,
  costingBreakdown,
  hourlyRateVoxdCost,
  hasGeneratedConcept,
  hasGeneratedProposal,
  isSuperAdmin,
  isOwnerPartner,
}: {
  quoteId: string;
  setupFee: number | null;
  monthlyFee: number | null;
  hourlyRate: number | null;
  contractNotes: string | null;
  setupFeeVoxdCost: number | null;
  monthlyFeeVoxdCost: number | null;
  buildDays: number | null;
  freeMonthlyMinutes: number | null;
  contractLength: number | null;
  costingBreakdown: CostingBreakdown | null;
  hourlyRateVoxdCost: number | null;
  hasGeneratedConcept: boolean;
  hasGeneratedProposal: boolean;
  isSuperAdmin: boolean;
  isOwnerPartner: boolean;
}) {
  const [calculatingCosting, setCalculatingCosting] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const canEditPartnerFields = isOwnerPartner || isSuperAdmin;
  const canEditAdminFields = isSuperAdmin;

  // Determine best source for costing calculation
  const costingSource = hasGeneratedProposal
    ? ("proposal" as const)
    : hasGeneratedConcept
      ? ("concept" as const)
      : null;

  async function calculateCosting() {
    if (!costingSource) return;
    setCalculatingCosting(true);
    const response = await saGenerateQuoteCosting({
      quoteId,
      source: costingSource,
    });
    if (!response.success) {
      toast.error(response.error || "Failed to calculate costing");
    } else {
      toast.success(
        response.data?.costingBreakdown.integrations.length === 0
          ? "Costing calculated — no integrations found, setup cost is £0"
          : "Costing calculated successfully",
      );
      if (response.data) {
        form.setValue(
          "setupFeeVoxdCost",
          response.data.setupFeeVoxdCost.toString(),
        );
        form.setValue(
          "monthlyFeeVoxdCost",
          response.data.monthlyFeeVoxdCost.toString(),
        );
        form.setValue("buildDays", response.data.buildDays.toString());
      }
      router.refresh();
    }
    setCalculatingCosting(false);
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      setupFee: setupFee?.toString() ?? "",
      monthlyFee: monthlyFee?.toString() ?? "",
      hourlyRate: hourlyRate?.toString() ?? "",
      contractNotes: contractNotes ?? "",
      setupFeeVoxdCost: setupFeeVoxdCost?.toString() ?? "",
      monthlyFeeVoxdCost: monthlyFeeVoxdCost?.toString() ?? "",
      buildDays: buildDays?.toString() ?? "",
      freeMonthlyMinutes: freeMonthlyMinutes?.toString() ?? "",
      contractLength: contractLength?.toString() ?? "",
    },
  });

  const submitPricing = useCallback(
    async (
      values: FormValues,
      options?: {
        silent?: boolean;
      },
    ) => {
      // Convert string values to numbers (or null if empty)
      const parseValue = (val: string) => (val === "" ? null : Number(val));

      const response = await saUpdateQuotePricing({
        quoteId,
        setupFee: parseValue(values.setupFee),
        monthlyFee: parseValue(values.monthlyFee),
        hourlyRate: parseValue(values.hourlyRate),
        contractNotes:
          values.contractNotes.trim() === "" ? null : values.contractNotes,
        setupFeeVoxdCost: parseValue(values.setupFeeVoxdCost),
        monthlyFeeVoxdCost: parseValue(values.monthlyFeeVoxdCost),
        buildDays: parseValue(values.buildDays),
        freeMonthlyMinutes: parseValue(values.freeMonthlyMinutes),
        contractLength: parseValue(values.contractLength),
      });

      if (!response.success) {
        if (response.error) {
          toast.error("There was an error updating the quote pricing");

          form.setError("root", {
            type: "manual",
            message: response.error,
          });
        }
        if (response.fieldErrors) {
          for (const key in response.fieldErrors) {
            form.setError(key as keyof typeof values, {
              type: "manual",
              message: response.fieldErrors[key],
            });
          }
        }
      }

      if (response.success) {
        if (!options?.silent) {
          toast.success("Quote pricing updated");
        }
        router.refresh();
      }
    },
    [form, quoteId, router],
  );

  const submitWithFeedback = useCallback(() => {
    form.handleSubmit((values) => submitPricing(values))();
  }, [form, submitPricing]);

  const watchedValues = form.watch();

  // Calculate margins (partner fee - voxd cost)
  const setupMargin =
    (Number(watchedValues.setupFee) || 0) -
    (Number(watchedValues.setupFeeVoxdCost) || 0);
  const monthlyMargin =
    (Number(watchedValues.monthlyFee) || 0) -
    (Number(watchedValues.monthlyFeeVoxdCost) || 0);
  const hourlyMargin =
    (Number(watchedValues.hourlyRate) || 0) - (hourlyRateVoxdCost ?? 0);

  // Save on blur for the 4 big partner fields
  // Debounced auto-save for fields that should save while typing.
  const debouncedFields = JSON.stringify({
    ...(canEditAdminFields
      ? {
          setupFeeVoxdCost: watchedValues.setupFeeVoxdCost,
          monthlyFeeVoxdCost: watchedValues.monthlyFeeVoxdCost,
          buildDays: watchedValues.buildDays,
          freeMonthlyMinutes: watchedValues.freeMonthlyMinutes,
          contractLength: watchedValues.contractLength,
        }
      : {}),
    ...(canEditPartnerFields
      ? {
          contractNotes: watchedValues.contractNotes,
        }
      : {}),
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (calculatingCosting) return;
    if (!canEditAdminFields && !canEditPartnerFields) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      form.handleSubmit((values) => submitPricing(values, { silent: true }))();
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    debouncedFields,
    calculatingCosting,
    canEditAdminFields,
    canEditPartnerFields,
    form,
    submitPricing,
  ]);

  return (
    <Form {...form}>
      <form className="space-y-8">
        {/* Partner editable fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="setupFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold inline-flex items-center gap-1">
                  Setup Fee
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-sm">
                        One-time setup fee that you will charge to the customer
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    className="text-4xl md:text-4xl h-16 font-bold border-2 border-primary"
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      submitWithFeedback();
                    }}
                    disabled={!canEditPartnerFields}
                  />
                </FormControl>
                <span
                  className={`inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium text-white ${setupMargin > 0 ? "bg-green-600" : "bg-red-600"}`}
                >
                  Margin: &pound;
                  {setupMargin.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthlyFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold inline-flex items-center gap-1">
                  Monthly Fee
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-sm">
                        Recurring monthly fee that you will charge to the
                        customer
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    className="text-4xl md:text-4xl h-16 font-bold border-2 border-primary"
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      submitWithFeedback();
                    }}
                    disabled={!canEditPartnerFields}
                  />
                </FormControl>
                <span
                  className={`inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium text-white ${monthlyMargin > 0 ? "bg-green-600" : "bg-red-600"}`}
                >
                  Margin: &pound;
                  {monthlyMargin.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold inline-flex items-center gap-1">
                  Hourly Rate
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-sm">
                        Hourly rate that you will charge for future changes
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    className="text-4xl md:text-4xl h-16 font-bold border-2 border-primary"
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      submitWithFeedback();
                    }}
                    disabled={!canEditPartnerFields}
                  />
                </FormControl>
                <span
                  className={`inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium text-white ${hourlyMargin > 0 ? "bg-green-600" : "bg-red-600"}`}
                >
                  Margin: &pound;
                  {hourlyMargin.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <FormMessage />
              </FormItem>
            )}
          />

          {!canEditAdminFields && (
            <FormField
              control={form.control}
              name="contractLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold inline-flex items-center gap-1">
                    Contract
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-sm">
                          Contract length in months. Minimum 12 months. Contact
                          Voxd if you need a shorter contract length.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="12"
                      min={12}
                      className="text-4xl md:text-4xl h-16 font-bold border-2 border-primary"
                      {...field}
                      onBlur={(e) => {
                        field.onBlur();
                        const val = e.target.value;
                        if (val !== "" && Number(val) < 12) {
                          field.onChange("12");
                        }
                        submitWithFeedback();
                      }}
                      disabled={!canEditPartnerFields}
                    />
                  </FormControl>
                  <span className="inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium opacity-0">
                    &nbsp;
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="contractNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">
                Contract Notes
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any quote-specific contract notes or agreed terms"
                  className="min-h-32"
                  {...field}
                  disabled={!canEditPartnerFields}
                />
              </FormControl>
              <FormDescription>
                Saved automatically as you type and shown in the proposal&apos;s
                Investment section.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Voxd Costs - editable form for super admin, professional read-only card for others */}
        {canEditAdminFields ? (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Voxd Costs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="setupFeeVoxdCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setup Fee (Voxd Cost)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Voxd&apos;s cost for setup
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthlyFeeVoxdCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Fee (Voxd Cost)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Voxd&apos;s monthly cost</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="freeMonthlyMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Free Monthly Minutes</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Free minutes included per month
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Length (months)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Contract length in months</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buildDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Build Days</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Days required to build this chatbot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Voxd Service Pricing</CardTitle>
              <CardDescription>
                What your partner account will be charged by Voxd for this
                chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1 inline-flex items-center gap-1 justify-center w-full">
                    Setup Cost
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-sm">
                          This is due in full before project commencement.
                          Minimum &pound;250.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                  <p className="text-2xl font-bold">
                    {setupFeeVoxdCost != null ? (
                      <>
                        {costingBreakdown?.costingCalculatedFrom ===
                          "concept" && "~"}
                        &pound;
                        {setupFeeVoxdCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {costingBreakdown &&
                    costingBreakdown.totalIntegrationTime > 0 ? (
                      <>
                        {costingBreakdown.totalIntegrationTime}h @ &pound;
                        {(hourlyRateVoxdCost ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                        /hr
                      </>
                    ) : (
                      "one-time"
                    )}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1 inline-flex items-center gap-1 justify-center w-full">
                    Monthly Cost
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-sm">
                          From completion of development.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                  <p className="text-2xl font-bold">
                    {monthlyFeeVoxdCost != null ? (
                      <>
                        {costingBreakdown?.costingCalculatedFrom ===
                          "concept" && "~"}
                        &pound;
                        {monthlyFeeVoxdCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    per month
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Free Minutes
                  </p>
                  <p className="text-2xl font-bold">
                    {freeMonthlyMinutes != null ? (
                      freeMonthlyMinutes.toLocaleString()
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    per month
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1 inline-flex items-center gap-1 justify-center w-full">
                    Contract Length
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-sm">
                          This can be reduced on request with good
                          justification.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                  <p className="text-2xl font-bold">
                    {contractLength != null ? (
                      contractLength
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">months</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1 inline-flex items-center gap-1 justify-center w-full">
                    Build Time
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-sm">
                          Working days from payment of setup costs. Minimum 1
                          day.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                  <p className="text-2xl font-bold">
                    {buildDays != null ? (
                      <>
                        {costingBreakdown?.costingCalculatedFrom ===
                          "concept" && "~"}
                        {buildDays}
                      </>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">days</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Hourly Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {hourlyRateVoxdCost != null ? (
                      <>
                        &pound;
                        {hourlyRateVoxdCost.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    per hour for future changes
                  </p>
                </div>
              </div>
              {costingBreakdown &&
                costingBreakdown.costingCalculatedFrom === "concept" && (
                  <Alert
                    variant="destructive"
                    className="mt-4 bg-destructive text-white [&>svg]:text-white [&>svg~*]:text-white [&_[data-slot=alert-description]]:text-white"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      These costs have been estimated from the concept. For
                      accurate pricing, generate or write a full proposal for
                      the client.
                    </AlertDescription>
                  </Alert>
                )}
            </CardContent>
          </Card>
        )}
      </form>

      {costingBreakdown && (
        <div className="border-t pt-6 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-medium">Cost Breakdown</h3>
            <Badge
              variant={
                costingBreakdown.costingCalculatedFrom === "concept"
                  ? "destructive"
                  : "secondary"
              }
            >
              Calculated from {costingBreakdown.costingCalculatedFrom}
            </Badge>
            {costingSource && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={calculatingCosting}
                onClick={calculateCosting}
              >
                {calculatingCosting && <Spinner className="mr-2" />}
                Recalculate
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {costingBreakdown.integrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This quote does not have any integrations defined, it will be a
                standalone agent. If this is incorrect, add some in the
                specification tab.
              </p>
            ) : (
              costingBreakdown.integrations.map((integration, i) => {
                const integrationHours = integration.tasks.reduce(
                  (sum, task) => sum + task.hours,
                  0,
                );
                const integrationCost =
                  integrationHours * (hourlyRateVoxdCost ?? 0);
                return (
                  <Collapsible key={i}>
                    <Card className="p-0">
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg">
                          <div className="flex items-center gap-3">
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90" />
                            <div>
                              <p className="font-medium text-sm">
                                {integration.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {integration.tasks.length} task
                                {integration.tasks.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <p className="font-medium">{integrationHours}h</p>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <p className="font-medium">
                                &pound;
                                {integrationCost.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 px-4 pb-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Task</TableHead>
                                <TableHead className="text-right w-[80px]">
                                  Hours
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {integration.tasks.map((task, j) => (
                                <TableRow key={j}>
                                  <TableCell className="font-medium">
                                    <span className="inline-flex items-center gap-1.5">
                                      {task.name}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top"
                                            className="max-w-xs text-sm"
                                          >
                                            {task.description}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {task.hours}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell>Subtotal</TableCell>
                                <TableCell className="text-right font-medium">
                                  {integrationHours}h &middot; &pound;
                                  {integrationCost.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </div>
        </div>
      )}

      {!costingBreakdown && costingSource && (
        <div className="border-t pt-6 mt-8">
          <h3 className="text-lg font-medium mb-2">Cost Breakdown</h3>
          <p className="text-sm text-muted-foreground mb-4">
            No costing breakdown yet. Calculate an estimate based on the
            existing {costingSource}.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={calculatingCosting}
            onClick={calculateCosting}
          >
            {calculatingCosting && <Spinner className="mr-2" />}
            Calculate Costing
          </Button>
        </div>
      )}
    </Form>
  );
}
