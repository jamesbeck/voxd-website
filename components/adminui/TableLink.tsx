import Link from "next/link";
import { ExternalLink } from "lucide-react";

const TableLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 hover:underline"
    >
      <ExternalLink
        className="h-[1em] w-[1em] shrink-0"
        style={{ color: "var(--color-primary)" }}
      />
      {children}
    </Link>
  );
};

export default TableLink;
