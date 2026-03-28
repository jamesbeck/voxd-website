"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import Image from "next/image";

export default function VerifyLoginForm({
  logoUrl,
  showLogoOnColour,
  redirectTo,
  devOtp,
}: {
  logoUrl?: string;
  showLogoOnColour?: string;
  redirectTo?: string;
  devOtp?: string;
}) {
  const form = useForm<{ otp: string }>({
    defaultValues: { otp: "" },
  });
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(values: { otp: string }) {
    setLoading(true);
    // In dev mode, use the master OTP if no code was entered
    const otpToSubmit = values.otp || devOtp || "";
    const result = await saVerifyLoginCode({
      otp: otpToSubmit,
      redirectTo,
    });

    if (!result.success) {
      // Handle error case
      setLoading(false);

      toast.error("There was an error creating the user");

      if (result.error) {
        form.setError("root", {
          type: "manual",
          message: result.error,
        });
      }

      if (result.fieldErrors) {
        for (const key in result.fieldErrors) {
          form.setError(key as keyof typeof values, {
            type: "manual",
            message: result.fieldErrors[key],
          });
        }
      }

      //empty the otp field
      form.setValue("otp", "");
      return;
    }

    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto mt-20 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
      <div
        className="mb-4 p-4"
        style={
          showLogoOnColour
            ? { backgroundColor: showLogoOnColour }
            : undefined
        }
      >
        <Image
          src={logoUrl || "/logo.svg"}
          alt="Logo"
          width={200}
          height={100}
          className="mx-auto"
          unoptimized
        />
      </div>
      <div className="px-6 pb-6">
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
                required: devOtp ? false : "Code is required",
                minLength: devOtp
                  ? undefined
                  : { value: 6, message: "Enter 6 digits" },
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

      <p className="pt-6 text-xs text-muted-foreground text-center">
        {"Didn't receive the email? Check your junk folder, make sure your email address is correct, or "}
        <Link href="/login" className="underline hover:text-foreground">
          restart the login
        </Link>
        .
      </p>
      </div>
    </div>
  );
}
