"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MailCheckIcon, GlobeIcon, LinkIcon } from "lucide-react";
import RecordActions from "@/components/admin/RecordActions";
import saCheckAllEmailVerifications from "@/actions/saCheckAllEmailVerifications";
import { saCheckAllVercelDomains } from "@/actions/saVercelDomain";
import { saCheckAllCoreDomains } from "@/actions/saCoreDomain";

export default function PartnersActions({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [isCheckingVercel, setIsCheckingVercel] = useState(false);
  const [isCheckingCore, setIsCheckingCore] = useState(false);
  const router = useRouter();

  const handleCheckAllVerifications = async () => {
    setIsChecking(true);
    const result = await saCheckAllEmailVerifications();

    if (!result.success) {
      toast.error(result.error || "Failed to check email verifications");
      setIsChecking(false);
      return;
    }

    const { checked, verified, created } = result.data!;
    toast.success(
      `Checked ${checked} domain(s): ${verified} verified, ${created} newly created`,
    );
    setIsChecking(false);
    router.refresh();
    onComplete?.();
  };

  const handleCheckAllVercelDomains = async () => {
    setIsCheckingVercel(true);
    const result = await saCheckAllVercelDomains();

    if (!result.success) {
      toast.error(result.error || "Failed to check Vercel domains");
      setIsCheckingVercel(false);
      return;
    }

    const { checked, verified, added, misconfigured } = result.data!;
    toast.success(
      `Checked ${checked} domain(s): ${verified} verified, ${added} added, ${misconfigured} misconfigured`,
    );
    setIsCheckingVercel(false);
    router.refresh();
    onComplete?.();
  };

  const handleCheckAllCoreDomains = async () => {
    setIsCheckingCore(true);
    const result = await saCheckAllCoreDomains();

    if (!result.success) {
      toast.error(result.error || "Failed to check core domains");
      setIsCheckingCore(false);
      return;
    }

    const { checked, verified, failed } = result.data!;
    toast.success(
      `Checked ${checked} core domain(s): ${verified} verified, ${failed} failed`,
    );
    setIsCheckingCore(false);
    router.refresh();
    onComplete?.();
  };

  return (
    <RecordActions
      dropdown={{
        loading: isChecking || isCheckingVercel || isCheckingCore,
        groups: [
          {
            items: [
              {
                label: "Check all email verifications",
                icon: <MailCheckIcon />,
                loading: isChecking,
                onSelect: handleCheckAllVerifications,
              },
              {
                label: "Check all Vercel domains",
                icon: <GlobeIcon />,
                loading: isCheckingVercel,
                onSelect: handleCheckAllVercelDomains,
              },
              {
                label: "Check all core domains",
                icon: <LinkIcon />,
                loading: isCheckingCore,
                onSelect: handleCheckAllCoreDomains,
              },
            ],
          },
        ],
      }}
    />
  );
}
