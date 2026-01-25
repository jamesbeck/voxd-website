import { WabaDbRecord } from "@/actions/saGetWabaById";
import DataCard, { DataItem } from "@/components/adminui/DataCard";
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Hash,
  Shield,
  Megaphone,
  BarChart3,
  Activity,
  AppWindow,
  AlertTriangle,
} from "lucide-react";

interface WabaInfoProps {
  waba: WabaDbRecord;
}

function getStatusIcon(status: string) {
  const lowerStatus = status.toLowerCase();
  if (
    lowerStatus === "active" ||
    lowerStatus === "approved" ||
    lowerStatus === "verified" ||
    lowerStatus === "available"
  ) {
    return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  }
  if (
    lowerStatus === "pending" ||
    lowerStatus === "in_progress" ||
    lowerStatus === "not_started"
  ) {
    return <Clock className="h-4 w-4 text-amber-500" />;
  }
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function getStatusVariant(
  status: string,
): "default" | "success" | "warning" | "danger" | "info" {
  const lowerStatus = status.toLowerCase();
  if (
    lowerStatus === "active" ||
    lowerStatus === "approved" ||
    lowerStatus === "verified" ||
    lowerStatus === "available"
  ) {
    return "success";
  }
  if (
    lowerStatus === "pending" ||
    lowerStatus === "in_progress" ||
    lowerStatus === "not_started"
  ) {
    return "warning";
  }
  if (
    lowerStatus === "rejected" ||
    lowerStatus === "failed" ||
    lowerStatus === "blocked"
  ) {
    return "danger";
  }
  return "default";
}

export default function WabaInfoTab({ waba }: WabaInfoProps) {
  const healthCanSend = waba.healthStatus?.can_send_message || "UNKNOWN";
  const healthEntities = waba.healthStatus?.entities || [];
  const subscribedApps = waba.subscribedApps?.data || [];

  // Build expanded health status value with entity details
  const renderHealthValue = () => {
    if (healthEntities.length === 0) {
      return healthCanSend;
    }

    return (
      <div className="space-y-2">
        <div className="font-semibold">{healthCanSend}</div>
        {healthEntities.map((entity, index) => (
          <div
            key={entity.id || index}
            className="text-xs border-l-2 pl-2 ml-1 border-muted-foreground/30"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{entity.entity_type}:</span>
              <span
                className={
                  entity.can_send_message?.toLowerCase() === "available"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : entity.can_send_message?.toLowerCase() === "limited"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                }
              >
                {entity.can_send_message}
              </span>
            </div>
            {entity.errors && entity.errors.length > 0 && (
              <div className="mt-1 space-y-1">
                {entity.errors.map((error, errIndex) => (
                  <div
                    key={errIndex}
                    className="bg-red-50 dark:bg-red-950/30 rounded p-2 text-red-700 dark:text-red-300"
                  >
                    <div className="flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium">
                          Error {error.error_code}: {error.error_description}
                        </div>
                        {error.possible_solution && (
                          <div className="text-red-600 dark:text-red-400 mt-0.5">
                            Solution: {error.possible_solution}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Build expanded subscribed apps value
  const renderSubscribedAppsValue = () => {
    if (subscribedApps.length === 0) {
      return <span className="text-muted-foreground">No apps subscribed</span>;
    }

    return (
      <div className="space-y-2">
        <div className="font-semibold">{subscribedApps.length} app(s) subscribed</div>
        {subscribedApps.map((app, index) => (
          <div
            key={app.whatsapp_business_api_data.id || index}
            className="text-xs border-l-2 pl-2 ml-1 border-muted-foreground/30"
          >
            <div className="flex items-center gap-2">
              <AppWindow className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">
                {app.whatsapp_business_api_data.name}
              </span>
            </div>
            <div className="text-muted-foreground ml-5 space-y-0.5">
              <div>ID: {app.whatsapp_business_api_data.id}</div>
              {app.whatsapp_business_api_data.category && (
                <div>Category: {app.whatsapp_business_api_data.category}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const dataItems: DataItem[] = [
    {
      icon: <Hash className="h-4 w-4" />,
      label: "Database ID",
      value: waba.id,
    },
    {
      icon: <Hash className="h-4 w-4" />,
      label: "Meta ID",
      value: waba.metaId,
    },
    {
      icon: <Building2 className="h-4 w-4" />,
      label: "Business Name",
      value: waba.businessName || "Not linked",
      variant: waba.businessName ? "default" : "warning",
    },
    {
      icon: <AppWindow className="h-4 w-4" />,
      label: "App",
      value: waba.appName || "Not linked",
      variant: waba.appName ? "default" : "warning",
    },
    {
      icon: getStatusIcon(waba.status),
      label: "Status",
      value: waba.status,
      variant: getStatusVariant(waba.status),
    },
    {
      icon: <Shield className="h-4 w-4" />,
      label: "Ownership Type",
      value: waba.ownershipType,
    },
    {
      icon: getStatusIcon(waba.businessVerificationStatus),
      label: "Business Verification",
      value: waba.businessVerificationStatus,
      variant: getStatusVariant(waba.businessVerificationStatus),
    },
    {
      icon: getStatusIcon(waba.accountReviewStatus),
      label: "Account Review",
      value: waba.accountReviewStatus,
      variant: getStatusVariant(waba.accountReviewStatus),
    },
    {
      icon: <Hash className="h-4 w-4" />,
      label: "Message Template Namespace",
      value: waba.messageTemplateNamespace || "N/A",
    },
    {
      icon: <Megaphone className="h-4 w-4" />,
      label: "Marketing Messages Lite API",
      value: waba.marketingMessagesLiteApiStatus,
      variant: getStatusVariant(waba.marketingMessagesLiteApiStatus),
    },
    {
      icon: <Megaphone className="h-4 w-4" />,
      label: "Marketing Messages Onboarding",
      value: waba.marketingMessagesOnboardingStatus,
      variant: getStatusVariant(waba.marketingMessagesOnboardingStatus),
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: "Health Status",
      value: renderHealthValue(),
      variant: getStatusVariant(healthCanSend),
    },
    {
      icon: <Globe className="h-4 w-4" />,
      label: "Timezone ID",
      value: waba.timezoneId,
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Enabled for Insights",
      value: waba.isEnabledForInsights ? "Yes" : "No",
      variant: waba.isEnabledForInsights ? "success" : "default",
    },
    {
      icon: <AppWindow className="h-4 w-4" />,
      label: "Subscribed Apps",
      value: renderSubscribedAppsValue(),
      variant: subscribedApps.length > 0 ? "success" : "warning",
    },
  ];

  return <DataCard items={dataItems} />;
}
