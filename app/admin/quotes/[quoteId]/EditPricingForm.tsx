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
import { useState } from "react";
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
import { Info } from "lucide-react";

const formSchema = z.object({
  setupFee: z.string(),
  monthlyFee: z.string(),
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
  setupFeeVoxdCost,
  monthlyFeeVoxdCost,
  buildDays,
  freeMonthlyMinutes,
  contractLength,
  costingBreakdown,
  hasGeneratedConcept,
  hasGeneratedProposal,
  isSuperAdmin,
  isOwnerPartner,
}: {
  quoteId: string;
  setupFee: number | null;
  monthlyFee: number | null;
  setupFeeVoxdCost: number | null;
  monthlyFeeVoxdCost: number | null;
  buildDays: number | null;
  freeMonthlyMinutes: number | null;
  contractLength: number | null;
  costingBreakdown: CostingBreakdown | null;
  hasGeneratedConcept: boolean;
  hasGeneratedProposal: boolean;
  isSuperAdmin: boolean;
  isOwnerPartner: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [calculatingCosting, setCalculatingCosting] = useState(false);
  const router = useRouter();

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
      toast.success("Costing calculated successfully");
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
      setupFeeVoxdCost: setupFeeVoxdCost?.toString() ?? "",
      monthlyFeeVoxdCost: monthlyFeeVoxdCost?.toString() ?? "",
      buildDays: buildDays?.toString() ?? "",
      freeMonthlyMinutes: freeMonthlyMinutes?.toString() ?? "",
      contractLength: contractLength?.toString() ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    // Convert string values to numbers (or null if empty)
    const parseValue = (val: string) => (val === "" ? null : Number(val));

    const response = await saUpdateQuotePricing({
      quoteId: quoteId,
      setupFee: parseValue(values.setupFee),
      monthlyFee: parseValue(values.monthlyFee),
      setupFeeVoxdCost: parseValue(values.setupFeeVoxdCost),
      monthlyFeeVoxdCost: parseValue(values.monthlyFeeVoxdCost),
      buildDays: parseValue(values.buildDays),
      freeMonthlyMinutes: parseValue(values.freeMonthlyMinutes),
      contractLength: parseValue(values.contractLength),
    });

    if (!response.success) {
      setLoading(false);

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
      toast.success("Quote pricing updated");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Partner editable fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="setupFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setup Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    disabled={!canEditPartnerFields}
                  />
                </FormControl>
                <FormDescription>
                  One-time setup fee charged to the customer
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthlyFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    disabled={!canEditPartnerFields}
                  />
                </FormControl>
                <FormDescription>
                  Recurring monthly fee charged to the customer
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Admin-only editable fields (visible to partners but not editable) */}
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
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      disabled={!canEditAdminFields}
                    />
                  </FormControl>
                  <FormDescription>
                    Voxd&apos;s cost for setup (Voxd only)
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
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      disabled={!canEditAdminFields}
                    />
                  </FormControl>
                  <FormDescription>
                    Voxd&apos;s monthly cost (Voxd only)
                  </FormDescription>
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
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      disabled={!canEditAdminFields}
                    />
                  </FormControl>
                  <FormDescription>
                    Free minutes included per month (Voxd only)
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
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      disabled={!canEditAdminFields}
                    />
                  </FormControl>
                  <FormDescription>
                    Contract length in months (Voxd only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Build Days - Separated section, visible to all, editable by super admin only */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Build Estimate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="buildDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Build Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      disabled={!canEditAdminFields}
                    />
                  </FormControl>
                  <FormDescription>
                    The number of days required to build this chatbot and its
                    integrations (Voxd only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {canEditPartnerFields && (
          <Button type="submit" disabled={loading}>
            {loading && <Spinner className="mr-2" />}
            Save Pricing
          </Button>
        )}
      </form>

      {costingBreakdown && (
        <div className="border-t pt-6 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-medium">Cost Breakdown</h3>
            <Badge variant="secondary">
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

          <div className="space-y-4">
            {costingBreakdown.integrations.map((integration, i) => {
              const integrationHours = integration.tasks.reduce(
                (sum, task) => sum + task.hours,
                0,
              );
              return (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {integration.name}
                    </CardTitle>
                    <CardDescription>
                      {integration.tasks.length} task
                      {integration.tasks.length !== 1 ? "s" : ""} &middot;{" "}
                      {integrationHours} hour
                      {integrationHours !== 1 ? "s" : ""} total
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
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
                            {integrationHours}h
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">
                    {costingBreakdown.totalIntegrationTime}h
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Setup Cost</p>
                  <p className="text-2xl font-bold">
                    &pound;
                    {costingBreakdown.totalIntegrationCost.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Monthly Cost</p>
                  <p className="text-2xl font-bold">
                    &pound;
                    {costingBreakdown.totalMonthly.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
