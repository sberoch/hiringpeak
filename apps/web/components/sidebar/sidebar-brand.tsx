import Image from "next/image";
import Link from "next/link";

/**
 * The sidebar's top brand: the Organization's logo when its Branding has one,
 * otherwise HiringPeak's logo and wordmark.
 */
export function SidebarBrand({
  logoUrl,
  organizationName,
}: {
  logoUrl: string | null;
  organizationName: string | null;
}) {
  return (
    <div className="flex items-center border-b border-sidebar-border px-5 py-6 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
      <Link
        href="/dashboard"
        className="group flex min-w-0 items-center gap-2.5 group-data-[collapsible=icon]:gap-0"
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={organizationName ?? "Logo de la organización"}
            width={600}
            height={600}
            unoptimized
            className="h-10 w-auto max-w-[180px] object-contain object-left transition-transform duration-200 group-hover:scale-105 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:object-center"
          />
        ) : (
          <>
            <Image
              src="/images/logo.png"
              alt="HiringPeak"
              width={36}
              height={36}
              className="h-9 w-auto transition-transform duration-200 group-hover:scale-105 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:object-contain"
            />
            <span className="font-sans text-lg font-bold tracking-tight text-ink group-data-[collapsible=icon]:sr-only">
              HiringPeak
            </span>
          </>
        )}
      </Link>
    </div>
  );
}

/**
 * A small, discreet HiringPeak mark for the bottom of the sidebar, shown only
 * when the Organization's logo has taken HiringPeak's place at the top.
 */
export function SidebarProductMark({ logoUrl }: { logoUrl: string | null }) {
  if (!logoUrl) return null;
  return (
    <div className="flex items-center gap-1.5 px-4 pb-3 text-[11px] font-medium text-muted-brand group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1">
      <Image
        src="/images/logo.png"
        alt="Hecho con HiringPeak"
        width={14}
        height={14}
        className="h-3.5 w-3.5 opacity-70"
      />
      <span className="group-data-[collapsible=icon]:sr-only" aria-hidden>
        HiringPeak
      </span>
    </div>
  );
}
