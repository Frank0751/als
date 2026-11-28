"use client";

// Site shell for every public page: skip link, header, footer, WhatsApp
// button. Navigation follows CLAUDE.md section 3: short top menu, secondary
// pages grouped in the footer. Every link is a real URL (next/link), so pages
// can be shared, bookmarked, opened in a new tab and crawled.

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, X, ShoppingBag, PackageSearch } from "lucide-react";
import { useCart, useRoute, setRouterPush } from "@/lib/als/store";
import { pathToView } from "@/lib/als/routes";
import { waLink } from "@/lib/als/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CatalogProvider, useCatalog } from "./catalog-context";
import { CatalogSkeleton, Logo } from "./ui-bits";

const NAV = [
  { href: "/about", label: "About" },
  { href: "/operations", label: "Operations" },
  { href: "/fingerlings", label: "Fingerlings" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/training", label: "Training" },
  { href: "/impact", label: "Impact" },
  { href: "/partner", label: "Partner with Us" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

// Postal address supplied by ALS (CLAUDE.md section 1)
const POSTAL = "P.O. Box 434, Akosombo, Eastern Region";

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

// Keeps the legacy view store in step with the address bar, so the
// prototype views that call navigate("fingerlings") keep working.
function RouteBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const sync = useRoute((s) => s.sync);

  useEffect(() => {
    setRouterPush((href) => router.push(href));
    return () => setRouterPush(null);
  }, [router]);

  useEffect(() => {
    sync({ view: pathToView(pathname), params: Object.fromEntries(search.entries()) });
  }, [pathname, search, sync]);

  // Old prototype links used #/view. Send them to the real page once.
  useEffect(() => {
    const h = window.location.hash;
    if (!h.startsWith("#/")) return;
    const [view, qs] = h.slice(2).split("?");
    const params = Object.fromEntries(new URLSearchParams(qs ?? "").entries());
    useRoute.getState().navigate(view || "home", params);
  }, []);

  return null;
}

const TEXT_SIZES = [
  { value: "normal", label: "A", name: "Standard text size" },
  { value: "large", label: "A+", name: "Large text" },
  { value: "larger", label: "A++", name: "Larger text" },
] as const;

function TextSizeControl({ tone }: { tone: "light" | "dark" }) {
  const [size, setSize] = useState("normal");

  useEffect(() => {
    setSize(document.documentElement.dataset.textSize ?? "normal");
  }, []);

  const choose = (value: string) => {
    setSize(value);
    if (value === "normal") delete document.documentElement.dataset.textSize;
    else document.documentElement.dataset.textSize = value;
    try {
      localStorage.setItem("als-text-size", value);
    } catch {
      /* storage blocked: the choice lasts for this page view */
    }
  };

  return (
    <div role="group" aria-label="Text size" className="flex items-center gap-1">
      <span className={cn("mr-2 text-sm", tone === "dark" ? "text-teal-100" : "text-ink-muted")}>Text size</span>
      {TEXT_SIZES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => choose(s.value)}
          aria-pressed={size === s.value}
          aria-label={s.name}
          className={cn(
            "inline-flex h-11 min-w-11 items-center justify-center rounded border px-2 font-semibold",
            tone === "dark"
              ? size === s.value
                ? "border-gold-soft bg-gold-soft text-volta-night"
                : "border-teal-700 text-sand hover:border-gold-soft"
              : size === s.value
                ? "border-volta bg-volta text-sand"
                : "border-line text-ink hover:border-volta"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function Header() {
  const pathname = usePathname();
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const count = cart.items.reduce((s, i) => s + i.qty, 0);

  // Close the mobile menu whenever the page changes
  useEffect(() => setOpen(false), [pathname]);

  // While the mobile menu is open, lock page scroll and let Escape close it
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-sand/95 backdrop-blur supports-[backdrop-filter]:bg-sand/85">
      <div className="container-als flex h-16 items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center rounded" aria-label="Aquatic Link Solutions, home">
          <Logo />
        </Link>

        <nav className="ml-4 hidden items-center xl:flex" aria-label="Main">
          {NAV.map((n) => {
            const current = isCurrent(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative px-2.5 py-2 text-[0.9375rem] font-medium whitespace-nowrap transition-colors",
                  "after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:transition-colors",
                  current ? "text-volta after:bg-gold" : "text-ink-muted hover:text-volta after:bg-transparent"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="relative h-11 rounded border-volta px-3 text-volta hover:bg-teal-50"
          >
            <Link href="/request-list" aria-label={`Request list, ${count} item${count === 1 ? "" : "s"}`}>
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Request list</span>
              {count > 0 && (
                <span className="tnum absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded bg-gold px-1 text-[11px] font-bold text-ink">
                  {count > 999 ? "999+" : count}
                </span>
              )}
            </Link>
          </Button>
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-teal-50 xl:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-sand xl:hidden"
          aria-label="Main"
        >
          <ul className="container-als py-2">
            {NAV.map((n) => {
              const current = isCurrent(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center border-l-2 px-3 text-base font-medium",
                      current ? "border-gold bg-paper text-volta" : "border-transparent text-ink"
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="container-als space-y-4 border-t border-line py-4">
            <Link
              href="/training/apply"
              className="flex min-h-12 items-center justify-center rounded bg-gold px-4 text-base font-semibold text-ink hover:bg-amber-400"
            >
              Apply to train, free
            </Link>
            <TextSizeControl tone="light" />
          </div>
        </nav>
      )}
    </header>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="inline-flex min-h-8 items-center text-teal-100 hover:text-sand hover:underline">
        {children}
      </Link>
    </li>
  );
}

function Footer() {
  const { content } = useCatalog();
  const wa1 = content("contact.whatsapp_1");
  const email = content("contact.email");
  const location = content("contact.location");

  const heading = "font-serif text-base font-semibold text-sand";

  return (
    <footer className="surface-dark no-print mt-auto bg-volta-night text-teal-100">
      <div className="container-als grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Tilapia fingerlings from our hatchery in Akuse, grow-out in cages on the Volta River, and free fish
            farming training with a focus on women and persons with disabilities.
          </p>
          <address className="mt-4 text-sm not-italic leading-relaxed">
            {location && <span className="block text-sand">{location}</span>}
            <span className="block">{POSTAL}</span>
          </address>
        </div>
        <div>
          <h2 className={cn(heading, "text-left")}>The farm</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <FooterLink href="/about">About ALS</FooterLink>
            <FooterLink href="/operations">Our operations</FooterLink>
            <FooterLink href="/fingerlings">Fingerlings</FooterLink>
            <FooterLink href="/marketplace">Marketplace</FooterLink>
            <FooterLink href="/impact">Impact</FooterLink>
            <FooterLink href="/blog">Blog</FooterLink>
          </ul>
        </div>
        <div>
          <h2 className={cn(heading, "text-left")}>Work with us</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <FooterLink href="/partner">Partner and invest</FooterLink>
            <FooterLink href="/training">Training programme</FooterLink>
            <FooterLink href="/training/apply">Apply to train, free</FooterLink>
            <FooterLink href="/faqs">Questions and answers</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </ul>
        </div>
        <div>
          <h2 className={cn(heading, "text-left")}>Site</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <FooterLink href="/accessibility">Accessibility statement</FooterLink>
            <FooterLink href="/privacy">Privacy policy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/admin">Staff sign-in</FooterLink>
          </ul>
        </div>
      </div>
      <div className="border-t border-teal-900">
        <div className="container-als flex flex-col gap-5 py-6 text-sm lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {wa1 && (
              <li>
                <a href={`tel:${wa1.replace(/\s+/g, "")}`} className="text-sand hover:underline">
                  Call {wa1}
                </a>
              </li>
            )}
            {wa1 && (
              <li>
                <a href={waLink(wa1, "Hello Aquatic Link Solutions!")} target="_blank" rel="noreferrer" className="text-sand hover:underline">
                  WhatsApp {wa1}
                  <span className="sr-only"> (opens WhatsApp)</span>
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="break-all text-sand hover:underline">
                  {email}
                </a>
              </li>
            )}
          </ul>
          <TextSizeControl tone="dark" />
        </div>
        {/* Extra bottom space on small screens so the WhatsApp button never covers this line */}
        <p className="container-als pb-24 text-sm lg:pb-8">
          © {new Date().getFullYear()} Aquatic Link Solutions, Akuse, Eastern Region, Ghana
        </p>
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  const { content } = useCatalog();
  const wa1 = content("contact.whatsapp_1");
  if (!wa1) return null;
  return (
    <a
      href={waLink(wa1, "Hello Aquatic Link Solutions! I have a question.")}
      target="_blank"
      rel="noreferrer"
      className="no-print wa-green fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom))] right-[calc(1rem_+_env(safe-area-inset-right))] z-40 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md"
      aria-label="Chat with ALS on WhatsApp (opens WhatsApp)"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.9 5 2.3 7L4 29l7.3-2.3c1.9 1 4 1.6 6.3 1.6h.4c6.6 0 12-5.3 12-11.9C30 8.3 22.6 3 16 3zm7.1 16.9c-.3.9-1.8 1.7-2.5 1.8-.6.1-1.4.2-2.3-.1-.5-.2-1.2-.4-2.1-.8-3.7-1.6-6.1-5.3-6.3-5.6-.2-.2-1.5-2-1.5-3.8 0-1.8.9-2.7 1.3-3.1.3-.4.7-.5 1-.5h.7c.2 0 .5-.1.8.6.3.8 1 2.6 1.1 2.8.1.2.2.4 0 .7-.1.3-.2.4-.4.7-.2.2-.4.5-.6.7-.2.2-.4.4-.2.8.2.4 1 1.7 2.2 2.7 1.5 1.3 2.8 1.7 3.2 1.9.4.2.6.2.9-.1.2-.3 1-1.2 1.3-1.6.3-.4.5-.3.9-.2.4.1 2.2 1.1 2.6 1.3.4.2.7.3.8.4.1.3.1.9-.2 1.8z" />
      </svg>
    </a>
  );
}

// Waits for the shared catalog (site content, products) before showing a
// page, with a designed loading state and a recoverable error state.
function CatalogGate({ children }: { children: React.ReactNode }) {
  const { catalog, error } = useCatalog();
  if (!catalog && !error) return <CatalogSkeleton />;
  if (error && !catalog)
    return (
      <div className="container-als max-w-md py-20 text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-volta" aria-hidden="true" />
        <p className="mt-4 text-center font-semibold">The site could not load.</p>
        <p className="mt-1 text-center text-sm text-ink-muted">{error}</p>
        <Button variant="outline" className="mt-6 rounded border-volta text-volta hover:bg-teal-50" onClick={() => window.location.reload()}>
          Reload the page
        </Button>
      </div>
    );
  return <>{children}</>;
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // After each page change, move focus to the main landmark so screen reader
  // and keyboard users start at the new content, not at the old link.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <CatalogProvider>
      <Suspense fallback={null}>
        <RouteBridge />
      </Suspense>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
          <CatalogGate>{children}</CatalogGate>
        </main>
        <Footer />
        <WhatsAppFloat />
      </div>
    </CatalogProvider>
  );
}
