"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import saVerifyLoginCode from "@/actions/saVerifyLoginCode";
import Link from "next/link";

export default function VerifyLoginForm() {
  const form = useForm<{ otp: string }>({
    defaultValues: { otp: "" },
  });
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(values: { otp: string }) {
    setLoading(true);
    const result = await saVerifyLoginCode({
      otp: values.otp,
    });
    if (result.success) {
      // TODO: Redirect or set session
      // router.push("/dashboard");
    } else {
      if (result.error) {
        for (const [key, value] of Object.entries(result.error)) {
          form.setError(key as any, { message: value });
        }
      }
    }
    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Enter Login Code
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center">
            <FormField
              control={form.control}
              name="otp"
              rules={{
                required: "Code is required",
                minLength: { value: 6, message: "Enter 6 digits" },
                maxLength: { value: 6, message: "Enter 6 digits" },
              }}
              render={({ field }) => (
                <FormItem>
                  {/* <FormLabel>6-digit code</FormLabel> */}
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
          <FormMessage>{form.formState.errors.root?.message}</FormMessage>
        </form>
      </Form>

      <div className="pt-8">
        <Link href="/login">
          <Button size={"sm"} variant={"outline"}>
            Restart Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
