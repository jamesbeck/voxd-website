"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import saSendLoginCode from "@/actions/saSendLoginCode";
import Image from "next/image";

export default function LoginForm({
  email,
  logoUrl,
  redirectTo,
}: {
  email?: string;
  logoUrl?: string;
  redirectTo?: string;
}) {
  const form = useForm<{ email: string }>({
    defaultValues: { email: email || "" },
  });
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function onSubmit(values: { email: string }) {
    setLoading(true);
    const sendLoginCodeResult = await saSendLoginCode({
      email: values.email,
      redirectTo,
    });
    if (!sendLoginCodeResult.success) {
      form.setError("root", { message: sendLoginCodeResult.error });
    } else {
      // This part might not be reached if saSendLoginCode redirects
      router.push(
        `/login/verify${redirectTo ? `?redirectTo=${redirectTo}` : ""}`
      );
    }
    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
      <Image
        src={logoUrl || "/logo.svg"}
        alt="Logo"
        width={200}
        height={100}
        className="mx-auto mb-4"
        unoptimized
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            rules={{ required: "Email is required" }}
            render={({ field }) => (
              <FormItem>
                {/* <FormLabel>Email address</FormLabel> */}
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.email?.message}
                </FormMessage>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Login Code"}
          </Button>
          <FormMessage>{form.formState.errors.root?.message}</FormMessage>
        </form>
      </Form>
    </div>
  );
}
