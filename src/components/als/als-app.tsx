"use client";

// ALS app shell: header, footer, WhatsApp button, view switching.
// Navigation follows CLAUDE.md section 3: short top menu, secondary pages in the footer.

import { useEffect, useState } from "react";
import { useRoute, useCart, useCustomer } from "@/lib/als/store";
import { useCatalog } from "./catalog-context";
import { CatalogProvider } from "./catalog-context";
import { Logo, Spinner } from "./ui-bits";
import { waLink } from "@/lib/als/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingBag, PackageSearch } from "lucide-react";
import HomeView from "./views/home-view";
import AboutView from "./views/about-view";
import OperationsView from "./views/operations-view";
import FingerlingsView from "./views/fingerlings-view";
import MarketplaceView from "./views/marketplace-view";
import TrainingView from "./views/training-view";
import ApplyView from "./views/apply-view";
import ImpactView from "./views/impact-view";
import PartnerView from "./views/partner-view";
import RequestListView from "./views/cart-view";
import RequestDetailsView from "./views/checkout-view";
import ConfirmView from "./views/confirm-view";
import TrackView from "./views/track-view";
import ReceiptView from "./views/receipt-view";
import VerifyView from "./views/verify-view";
import AccountView from "./views/account-view";
import FaqsView from "./views/faqs-view";
import ContactView from "./views/contact-view";
import PoliciesView from "./views/policies-view";
import DashboardView from "./views/dashboard-view";

const NAV = [
  { view: "about", label: "About" },
  { view: "operations", label: "Operations" },
  { view: "fingerlings", label: "Fingerlings" },
  { view: "market", label: "Marketplace" },
  { view: "training", label: "Training" },
  { view: "impact", label: "Impact" },
  { view: "partner", label: "Partner with Us" },
  { view: "contact", label: "Contact" },
];

function Header() {
  const { view, navigate } = useRoute();
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const count = cart.items.reduce((s, i) => s + i.qty, 0);

  return (
    <header className="no-print sticky top-0 z-40 border-b bg-[#F4F0E6]/95 backdrop-blur supports-[backdrop-filter]:bg-[#F4F0E6]/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <button
          onClick={() => navigate("home")}
          className="flex items-center"
          aria-label="Aquatic Link Solutions, go to home"
        >
          <Logo />
        </button>

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <button
              key={n.view}
              onClick={() => navigate(n.view)}
              className={cn(
                "rounded px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                view === n.view ? "bg-teal-800 text-white" : "text-stone-600 hover:bg-teal-50 hover:text-teal-800"
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() => navigate("cart")}
            variant="outline"
            className="relative h-10 rounded border-teal-800 px-3 text-teal-800 hover:bg-teal-50"
            aria-label={`Request list, ${count} item(s)`}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Request list</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded bg-amber-500 px-1 text-[11px] font-bold text-stone-900">
                {count > 999 ? "999+" : count}
              </span>
            )}
          </Button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded text-stone-700 hover:bg-teal-50 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t bg-[#F4F0E6] px-4 pb-4 pt-2 lg:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <button
              key={n.view}
              onClick={() => { navigate(n.view); setOpen(false); }}
              className={cn(
                "flex min-h-11 w-full items-center rounded px-3 py-3 text-left text-sm font-medium",
                view === n.view ? "bg-teal-800 text-white" : "text-stone-700"
              )}
            >
              {n.label}
            </button>
          ))}
          <button
            onClick={() => { navigate("apply"); setOpen(false); }}
            className="mt-2 flex min-h-11 w-full items-center rounded bg-amber-500 px-3 py-3 text-left text-sm font-semibold text-stone-900"
          >
            Apply to train, free
          </button>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { navigate } = useRoute();
  const { content } = useCatalog();
  const wa1 = content("contact.whatsapp_1");
  const wa2 = content("contact.whatsapp_2");
  const email = content("contact.email");
  const location = content("contact.location");

  const col = "text-left text-sm font-semibold uppercase tracking-wider text-teal-200";
  const link = "hover:text-white hover:underline";
  const item = "text-left hover:text-white hover:underline";

  return (
    <footer className="mt-auto border-t bg-teal-950 text-teal-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-3 text-sm leading-relaxed text-teal-100/80">
            Aquatic Link Solutions produces quality tilapia fingerlings in Akuse and raises market-size tilapia in cages on the Volta River. We train farmers, with a focus on women and persons with disabilities.
          </p>
          <p className="mt-3 text-sm font-medium text-teal-100">{location}</p>
          <p className="mt-1 text-sm text-teal-100/80">P.O. Box Akosombo</p>
        </div>
        <div>
          <h3 className={col}>Explore</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><button onClick={() => navigate("about")} className={item}>About ALS</button></li>
            <li><button onClick={() => navigate("operations")} className={item}>Our operations</button></li>
            <li><button onClick={() => navigate("fingerlings")} className={item}>Fingerlings</button></li>
            <li><button onClick={() => navigate("market")} className={item}>Marketplace</button></li>
            <li><button onClick={() => navigate("impact")} className={item}>Impact</button></li>
          </ul>
        </div>
        <div>
          <h3 className={col}>Get involved</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><button onClick={() => navigate("partner")} className={item}>Partner and invest</button></li>
            <li><button onClick={() => navigate("apply")} className={item}>Apply to train, free</button></li>
            <li><button onClick={() => navigate("training")} className={item}>Training programme</button></li>
            <li><button onClick={() => navigate("faqs")} className={item}>FAQs</button></li>
            <li><button onClick={() => navigate("contact")} className={item}>Contact</button></li>
          </ul>
        </div>
        <div>
          <h3 className={col}>Support and legal</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><button onClick={() => navigate("track")} className={item}>Track a request</button></li>
            <li><button onClick={() => navigate("verify")} className={item}>Verify a receipt</button></li>
            <li><button onClick={() => navigate("account")} className={item}>My account</button></li>
            <li><button onClick={() => navigate("policies", { tab: "accessibility" })} className={item}>Accessibility statement</button></li>
            <li><button onClick={() => navigate("policies", { tab: "privacy" })} className={item}>Privacy and terms</button></li>
            <li><button onClick={() => navigate("dash")} className={item}>Staff portal</button></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-teal-900 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {wa1 && <li><a href={waLink(wa1, "Hello Aquatic Link Solutions!")} target="_blank" rel="noreferrer" className={link}>WhatsApp {wa1}</a></li>}
            {wa2 && <li><a href={waLink(wa2, "Hello Aquatic Link Solutions!")} target="_blank" rel="noreferrer" className={link}>WhatsApp {wa2}</a></li>}
            {email && <li><a href={`mailto:${email}`} className={link}>{email}</a></li>}
          </ul>
          <p className="text-xs text-teal-200/70">
            © {new Date().getFullYear()} Aquatic Link Solutions (ALS), Akuse, Eastern Region, Ghana
          </p>
        </div>
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
      className="no-print fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom))] right-[calc(1rem_+_env(safe-area-inset-right))] z-40 inline-flex h-14 w-14 items-center justify-center rounded-full shadow-lg wa-green text-white"
      aria-label="Chat with ALS on WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.9 5 2.3 7L4 29l7.3-2.3c1.9 1 4 1.6 6.3 1.6h.4c6.6 0 12-5.3 12-11.9C30 8.3 22.6 3 16 3zm7.1 16.9c-.3.9-1.8 1.7-2.5 1.8-.6.1-1.4.2-2.3-.1-.5-.2-1.2-.4-2.1-.8-3.7-1.6-6.1-5.3-6.3-5.6-.2-.2-1.5-2-1.5-3.8 0-1.8.9-2.7 1.3-3.1.3-.4.7-.5 1-.5h.7c.2 0 .5-.1.8.6.3.8 1 2.6 1.1 2.8.1.2.2.4 0 .7-.1.3-.2.4-.4.7-.2.2-.4.5-.6.7-.2.2-.4.4-.2.8.2.4 1 1.7 2.2 2.7 1.5 1.3 2.8 1.7 3.2 1.9.4.2.6.2.9-.1.2-.3 1-1.2 1.3-1.6.3-.4.5-.3.9-.2.4.1 2.2 1.1 2.6 1.3.4.2.7.3.8.4.1.3.1.9-.2 1.8z"/>
      </svg>
    </a>
  );
}

function ViewSwitch() {
  const { view, params } = useRoute();
  const { catalog, error } = useCatalog();

  if (!catalog && !error) return <Spinner label="Loading Aquatic Link Solutions…" />;
  if (error && !catalog)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-teal-800" aria-hidden="true" />
        <p className="mt-4 font-semibold">The site could not load.</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    );

  switch (view) {
    case "home": return <HomeView />;
    case "about": return <AboutView />;
    case "operations":
    case "farm": return <OperationsView />;
    case "fingerlings": return <FingerlingsView />;
    case "market": return <MarketplaceView />;
    case "training": return <TrainingView />;
    case "apply": return <ApplyView />;
    case "impact": return <ImpactView />;
    case "partner": return <PartnerView />;
    case "cart": return <RequestListView />;
    case "checkout": return <RequestDetailsView />;
    case "confirm": return <ConfirmView orderNumber={params.order ?? ""} initialPhone={params.phone ?? ""} />;
    case "track": return <TrackView params={params} />;
    case "receipt": return <ReceiptView orderNumber={params.order ?? ""} initialPhone={params.phone ?? ""} />;
    case "verify": return <VerifyView code={params.code ?? ""} />;
    case "account": return <AccountView />;
    case "faqs": return <FaqsView />;
    case "contact": return <ContactView />;
    case "policies": return <PoliciesView tab={params.tab ?? "privacy"} />;
    case "dash": return <DashboardView />;
    default: return <HomeView />;
  }
}

export default function AlsApp() {
  const syncFromHash = useRoute((s) => s.syncFromHash);
  useEffect(() => {
    syncFromHash();
  }, [syncFromHash]);

  const customer = useCustomer((s) => s.customer);

  return (
    <CatalogProvider>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-stone-900"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          <ViewSwitch />
        </main>
        <Footer />
        <WhatsAppFloat />
        {/* keep customer store referenced so hydration is stable */}
        <span className="hidden">{customer?.name ?? ""}</span>
      </div>
    </CatalogProvider>
  );
}
