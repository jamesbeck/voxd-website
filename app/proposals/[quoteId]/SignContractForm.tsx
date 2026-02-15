"use client";

import { useState } from "react";
import { FileCheck, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import saSignQuoteContract from "@/actions/saSignQuoteContract";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SignContractForm({
  quoteId,
  brandColor,
  partnerName,
  organisationName,
  ipAddress,
  userAgent,
  existingSignOff,
}: {
  quoteId: string;
  brandColor: string;
  partnerName: string;
  organisationName: string;
  ipAddress: string | null;
  userAgent: string | null;
  existingSignOff: {
    name: string | null;
    email: string | null;
    position: string | null;
    date: string | null;
    ipAddress: string | null;
  } | null;
}) {
  const router = useRouter();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [hasAuthority, setHasAuthority] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // If already signed, show the signed state immediately
  const alreadySigned = existingSignOff !== null;

  const canSubmit =
    legalName.trim() !== "" &&
    email.trim() !== "" &&
    position.trim() !== "" &&
    hasAuthority &&
    agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);

    const response = await saSignQuoteContract({
      quoteId,
      signOffName: legalName,
      signOffEmail: email,
      signOffPosition: position,
      ipAddress,
      userAgent,
    });

    if (!response.success) {
      setIsSubmitting(false);
      if (response.fieldErrors) {
        setErrors(response.fieldErrors);
      }
      if (response.error) {
        toast.error(response.error);
      }
      return;
    }

    setIsSuccess(true);
    toast.success("Contract signed successfully!");
    router.refresh();
  };

  // Show signed confirmation for both freshly signed and already signed
  if (isSuccess || alreadySigned) {
    // Use fresh data if just signed, otherwise use existing sign-off data
    const displayName = isSuccess ? legalName : existingSignOff?.name || "";
    const displayEmail = isSuccess ? email : existingSignOff?.email || "";
    const displayPosition = isSuccess
      ? position
      : existingSignOff?.position || "";
    const displayIpAddress = isSuccess ? ipAddress : existingSignOff?.ipAddress;
    const displayDate = isSuccess
      ? new Date()
      : existingSignOff?.date
        ? new Date(existingSignOff.date)
        : null;

    return (
      <section
        id="sign-contract"
        className="rounded-xl p-4 md:p-6 space-y-4 scroll-mt-8 bg-green-50 border border-green-200"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-green-800">
              Contract Signed{isSuccess ? " Successfully!" : ""}
            </h2>
            <p className="text-green-700 mt-1">
              {isSuccess
                ? `Thank you for signing. ${partnerName} will be in touch shortly to get started.`
                : `This proposal has been signed. ${partnerName} will be in touch shortly.`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-green-200 space-y-3">
          <h3 className="font-medium text-gray-900 text-sm">
            Signing Details Recorded
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>{" "}
              <span className="text-gray-900 font-medium">{displayName}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>{" "}
              <span className="text-gray-900 font-medium">{displayEmail}</span>
            </div>
            <div>
              <span className="text-gray-500">Position:</span>{" "}
              <span className="text-gray-900 font-medium">
                {displayPosition}
              </span>
            </div>
            <div>
              <span className="text-gray-500">IP Address:</span>{" "}
              <span className="text-gray-900 font-medium">
                {displayIpAddress || "Not recorded"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Signed:</span>{" "}
              <span className="text-gray-900 font-medium">
                {displayDate
                  ? displayDate.toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not recorded"}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 space-y-1 text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>
                Confirmed authority to sign on behalf of {organisationName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Agreed to Terms and Conditions</span>
            </div>
          </div>
        </div>

        {isSuccess && (
          <p className="text-xs text-green-600 text-center">
            A confirmation email has been sent to {displayEmail}
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      id="sign-contract"
      className="rounded-xl p-4 md:p-6 space-y-4 scroll-mt-8"
      style={{ backgroundColor: `${brandColor}10` }}
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Ready to proceed?</h2>
        <p className="text-gray-600">
          Sign the contract below to confirm your order and get started.
        </p>
      </div>

      {!isFormVisible ? (
        <div className="text-center">
          <button
            onClick={() => setIsFormVisible(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            <FileCheck className="h-5 w-5" />
            Sign Contract
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="legalName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Your Full Legal Name *
                </label>
                <input
                  id="legalName"
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-transparent focus:ring-2"
                  style={
                    {
                      "--tw-ring-color": brandColor,
                    } as React.CSSProperties
                  }
                />
                {errors.signOffName && (
                  <p className="text-sm text-red-600">{errors.signOffName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Your Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@company.com"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-transparent focus:ring-2"
                  style={
                    {
                      "--tw-ring-color": brandColor,
                    } as React.CSSProperties
                  }
                />
                {errors.signOffEmail && (
                  <p className="text-sm text-red-600">{errors.signOffEmail}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="position"
                className="block text-sm font-medium text-gray-700"
              >
                Your Position at {organisationName} *
              </label>
              <input
                id="position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Managing Director, CEO, Owner"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-transparent focus:ring-2"
                style={
                  {
                    "--tw-ring-color": brandColor,
                  } as React.CSSProperties
                }
              />
              {errors.signOffPosition && (
                <p className="text-sm text-red-600">{errors.signOffPosition}</p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="authority"
                  checked={hasAuthority}
                  onCheckedChange={(checked) =>
                    setHasAuthority(checked === true)
                  }
                  className="mt-1"
                  style={
                    {
                      "--tw-ring-color": brandColor,
                      borderColor: hasAuthority ? brandColor : undefined,
                      backgroundColor: hasAuthority ? brandColor : undefined,
                    } as React.CSSProperties
                  }
                />
                <label
                  htmlFor="authority"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  I confirm that I have the authority to enter into this
                  agreement on behalf of <strong>{organisationName}</strong> and
                  to bind the organisation to the terms and conditions set out
                  in this proposal.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreeToTerms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) =>
                    setAgreedToTerms(checked === true)
                  }
                  className="mt-1"
                  style={
                    {
                      "--tw-ring-color": brandColor,
                      borderColor: agreedToTerms ? brandColor : undefined,
                      backgroundColor: agreedToTerms ? brandColor : undefined,
                    } as React.CSSProperties
                  }
                />
                <label
                  htmlFor="agreeToTerms"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  I have read, understood, and agree to be bound by the{" "}
                  <a
                    href="#terms"
                    className="underline"
                    style={{ color: brandColor }}
                  >
                    Terms and Conditions
                  </a>{" "}
                  set out above.
                </label>
              </div>
            </div>

            {/* Binding Agreement Declaration */}
            <div
              className="p-4 rounded-lg border text-sm text-gray-700"
              style={{
                backgroundColor: `${brandColor}05`,
                borderColor: `${brandColor}30`,
              }}
            >
              <p className="font-medium mb-2">Declaration</p>
              <p>
                By clicking &quot;Confirm & Sign Contract&quot; below, I
                acknowledge that this constitutes a legally binding agreement
                between <strong>{organisationName}</strong> and{" "}
                <strong>{partnerName}</strong>, effective from the date of
                signing. I understand that this electronic signature has the
                same legal effect as a handwritten signature.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <ChevronUp className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="px-6 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                style={{ backgroundColor: brandColor }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="h-5 w-5" />
                    Signing...
                  </>
                ) : (
                  <>
                    <FileCheck className="h-5 w-5" />
                    Confirm & Sign Contract
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Your IP address and browser information will be recorded for
              verification purposes.
            </p>
          </form>
        </div>
      )}
    </section>
  );
}
