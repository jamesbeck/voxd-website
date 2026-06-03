export type SessionStatusKey =
  | "active"
  | "paused"
  | "closed"
  | "deleted-by-user";

type SessionStatusInput = {
  closedAt?: Date | string | null;
  paused?: boolean | null;
  deletedByUser?: boolean | null;
};

type SessionStatus = {
  key: SessionStatusKey;
  label: string;
  badgeClassName: string;
  dataCardVariant: "success" | "warning" | "danger";
  isClosedLike: boolean;
};

export function getSessionStatus({
  closedAt,
  paused,
  deletedByUser,
}: SessionStatusInput): SessionStatus {
  if (deletedByUser) {
    return {
      key: "deleted-by-user",
      label: "Deleted by user",
      badgeClassName: "bg-red-500",
      dataCardVariant: "danger",
      isClosedLike: true,
    };
  }

  if (closedAt) {
    return {
      key: "closed",
      label: "Closed",
      badgeClassName: "bg-gray-500",
      dataCardVariant: "danger",
      isClosedLike: true,
    };
  }

  if (paused) {
    return {
      key: "paused",
      label: "Paused",
      badgeClassName: "bg-yellow-500",
      dataCardVariant: "warning",
      isClosedLike: false,
    };
  }

  return {
    key: "active",
    label: "Active",
    badgeClassName: "bg-green-500",
    dataCardVariant: "success",
    isClosedLike: false,
  };
}
