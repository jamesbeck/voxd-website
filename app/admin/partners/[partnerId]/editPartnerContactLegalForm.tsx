"use client";
import { AlertCircleIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import saUpdatePartner from "@/actions/saUpdatePartner";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  salesEmail: z.string().optional(),
  accountsEmail: z.string().optional(),
  legalName: z.string().optional(),
  companyNumber: z.string().optional(),
  registeredAddress: z.string().optional(),
  legalEmail: z.string().optional(),
});

export default function EditPartnerContactLegalForm({
  partnerId,
  salesEmail,
  accountsEmail,
  legalName,
  companyNumber,
  registeredAddress,
  legalEmail,
}: {
  partnerId: string;
  salesEmail?: string;
  accountsEmail?: string;
  legalName?: string;
  companyNumber?: string;
  registeredAddress?: string;
  legalEmail?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesEmail: salesEmail || "",
      accountsEmail: accountsEmail || "",
      legalName: legalName || "",
      companyNumber: companyNumber || "",
      registeredAddress: registeredAddress || "",
      legalEmail: legalEmail || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdatePartner({
      partnerId,
      salesEmail: values.salesEmail,
      accountsEmail: values.accountsEmail,
      legalName: values.legalName,
      companyNumber: values.companyNumber,
      registeredAddress: values.registeredAddress,
      legalEmail: values.legalEmail,
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error updating the partner");
      if (response.error) {
        form.setError("root", { type: "manual", message: response.error });
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
      toast.success("Partner contact & legal details updated");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="salesEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sales Email</FormLabel>
              <FormControl>
                <Input placeholder="sales@partner.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountsEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accounts Email</FormLabel>
              <FormControl>
                <Input placeholder="accounts@partner.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Name</FormLabel>
              <FormControl>
                <Input placeholder="Partner Ltd" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Number</FormLabel>
              <FormControl>
                <Input placeholder="12345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registeredAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registered Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main Street, London, SW1A 1AA"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="legalEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Email</FormLabel>
              <FormControl>
                <Input placeholder="legal@partner.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="max-w-xl">
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading && <Spinner />}
          Save
        </Button>
      </form>
    </Form>
  );
}
