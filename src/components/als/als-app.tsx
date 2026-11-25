"use client";

// ALS app shell, header, footer, WhatsApp button, route switching (single-page store)

import { useEffect, useState } from "react";
import { useRoute, useCart, useCustomer } from "@/lib/als/store";
import { useCatalog } from "./catalog-context";
import { CatalogProvider } from "./catalog-context";
import { Logo, Spinner } from "./ui-bits";
import { waLink } from "@/lib/als/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home, Fish, ShoppingBag, GraduationCap, PackageSearch, Menu, X,
  ClipboardList, BadgeCheck, User, Info, HelpCircle, Phone, ShieldCheck,
} from "lucide-react";
import HomeView from "./views/home-view";
import FingerlingsView from "./views/fingerlings-view";
import MarketplaceView from "./views/marketplace-view";
import TrainingView from "./views/training-view";
import CartView from "./views/cart-view";
import CheckoutView from "./views/checkout-view";
import ConfirmView from "./views/confirm-view";
import TrackView from "./views/track-view";
import ReceiptView from "./views/receipt-view";
import VerifyView from "./views/verify-view";
import AccountView from "./views/account-view";
import FarmView from "./views/farm-view";
import FaqsView from "./views/faqs-view";
import ContactView from "./views/contact-view";
import PoliciesView from "./views/policies-view";
import DashboardView from "./views/dashboard-view";

const NAV = [
  { view: "fingerlings", label: "Fingerlings", icon: Fish },
  { view: "market", label: "Marketplace", icon: ShoppingBag },
  { view: "training", label: "Training", icon: GraduationCap },
  { view: "farm", label: "Our Farm", icon: Info },
  { view: "faqs", label: "FAQs", icon: HelpCircle },
  { view: "contact", label: "Contact", icon: Phone },
];

function Header() {
  const { view, navigate } = useRoute();
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const count = cart.items.reduce((s, i) => s + i.qty, 0);
  const dash = view === "dash";

  return (
    <header className="no-print sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <button
          onClick={() => navigate("home")}
          className="flex items-center"
          aria-label="Aquatic Link Solutions, go to home"
        >
          <Logo />
        </button>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <button
              key={n.view}
              onClick={() => navigate(n.view)}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                view === n.view ? "bg-teal-700 text-white" : "text-stone-600 hover:bg-teal-50 hover:text-teal-800"
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate("track")}
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium sm:inline-flex",
              view === "track" ? "bg-teal-700 text-white" : "text-stone-600 hover:bg-teal-50 hover:text-teal-800"
            )}
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" /> Track order
          </button>
          <button
            onClick={() => navigate("verify")}
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium md:inline-flex",
              view === "verify" ? "bg-teal-700 text-white" : "text-stone-600 hover:bg-teal-50 hover:text-teal-800"
            )}
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Verify receipt
          </button>
          <button
            onClick={() => navigate("account")}
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium sm:inline-flex",
              view === "account" ? "bg-teal-700 text-white" : "text-stone-600 hover:bg-teal-50 hover:text-teal-800"
            )}
            aria-label="My account"
          >
            <User className="h-4 w-4" aria-hidden="true" />
          </button>
          <Button
            onClick={() => navigate("cart")}
            className="relative h-10 rounded-full px-4"
            aria-label={`Cart, ${count} item(s)`}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
                {count > 999 ? "999+" : count}
              </span>
            )}
          </Button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-700 hover:bg-teal-50 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Open menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t bg-white px-4 pb-4 pt-2 lg:hidden" aria-label="Mobile">
          {[{ view: "home", label: "Home", icon: Home }, ...NAV, { view: "track", label: "Track order", icon: ClipboardList }, { view: "verify", label: "Verify receipt", icon: BadgeCheck }, { view: "account", label: "My account", icon: User }].map((n) => (
            <button
              key={n.view}
              onClick={() => { navigate(n.view); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium",
                view === n.view ? "bg-teal-50 text-teal-800" : "text-stone-700"
              )}
            >
              <n.icon className="h-4 w-4 text-teal-700" aria-hidden="true" /> {n.label}
            </button>
          ))}
        </nav>
      )}
      {dash && null}
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

  return (
    <footer className="mt-auto border-t bg-teal-950 text-teal-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-3 text-sm leading-relaxed text-teal-100/80">
            Quality tilapia fingerlings from our hatchery in Akuse, and grow-out in cage systems on the Volta River. Over 17 years in aquaculture.
          </p>
          <p className="mt-3 text-sm font-medium text-teal-100">{location}</p>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-teal-200">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><button onClick={() => navigate("fingerlings")} className="hover:text-white hover:underline">Fingerlings</button></li>
            <li><button onClick={() => navigate("market")} className="hover:text-white hover:underline">Marketplace</button></li>
            <li><button onClick={() => navigate("training")} className="hover:text-white hover:underline">Training</button></li>
            <li><button onClick={() => navigate("cart")} className="hover:text-white hover:underline">Your cart</button></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-teal-200">Customer care</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><button onClick={() => navigate("track")} className="hover:text-white hover:underline">Track your order</button></li>
            <li><button onClick={() => navigate("verify")} className="hover:text-white hover:underline">Verify a receipt</button></li>
            <li><button onClick={() => navigate("faqs")} className="hover:text-white hover:underline">FAQs</button></li>
            <li><button onClick={() => navigate("policies")} className="hover:text-white hover:underline">Policies</button></li>
            <li><button onClick={() => navigate("account")} className="hover:text-white hover:underline">My account</button></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-teal-200">Talk to us</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {wa1 && <li><a href={waLink(wa1, "Hello Aquatic Link Solutions!")} target="_blank" rel="noreferrer" className="hover:text-white hover:underline">WhatsApp 1: {wa1}</a></li>}
            {wa2 && <li><a href={waLink(wa2, "Hello Aquatic Link Solutions!")} target="_blank" rel="noreferrer" className="hover:text-white hover:underline">WhatsApp 2: {wa2}</a></li>}
            {email && <li><a href={`mailto:${email}`} className="hover:text-white hover:underline">{email}</a></li>}
            <li><button onClick={() => navigate("contact")} className="hover:text-white hover:underline">Contact page</button></li>
          </ul>
          <div className="mt-4 flex gap-2 text-xs">
            <button onClick={() => navigate("dash")} className="rounded border border-teal-700 px-2 py-1 text-teal-200 hover:bg-teal-900" aria-label="ALS staff dashboard">
              Staff dashboard
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-teal-900 py-4 text-center text-xs text-teal-200/70">
        © {new Date().getFullYear()} Aquatic Link Solutions (ALS), Akuse, Eastern Region, Ghana, sustainable fish farming since 2009.
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
      className="no-print fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full shadow-lg wa-green text-white"
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

  if (!catalog && !error) return <Spinner label="Loading the ALS store…" />;
  if (error && !catalog)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-teal-700" aria-hidden="true" />
        <p className="mt-4 font-semibold">The store could not load.</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    );

  switch (view) {
    case "fingerlings": return <FingerlingsView />;
    case "market": return <MarketplaceView />;
    case "training": return <TrainingView />;
    case "cart": return <CartView />;
    case "checkout": return <CheckoutView />;
    case "confirm": return <ConfirmView orderNumber={params.order ?? ""} initialPhone={params.phone ?? ""} />;
    case "track": return <TrackView params={params} />;
    case "receipt": return <ReceiptView orderNumber={params.order ?? ""} initialPhone={params.phone ?? ""} />;
    case "verify": return <VerifyView code={params.code ?? ""} />;
    case "account": return <AccountView />;
    case "farm": return <FarmView />;
    case "impact": return <FarmView impact />;
    case "faqs": return <FaqsView />;
    case "contact": return <ContactView />;
    case "policies": return <PoliciesView />;
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
        <Header />
        <main className="flex-1">
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
