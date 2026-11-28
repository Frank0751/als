// Clean URLs for every public page (CLAUDE.md section 10).
// Views still call navigate("fingerlings") etc.; this file maps those view
// names to real paths so each page has its own URL, title and history entry.

export const VIEW_PATHS: Record<string, string> = {
  home: "/",
  about: "/about",
  operations: "/operations",
  farm: "/operations",
  fingerlings: "/fingerlings",
  market: "/marketplace",
  training: "/training",
  apply: "/training/apply",
  impact: "/impact",
  partner: "/partner",
  blog: "/blog",
  cart: "/request-list",
  checkout: "/request-list/details",
  confirm: "/request-list/sent",
  faqs: "/faqs",
  contact: "/contact",
  dash: "/admin",
};

const POLICY_PATHS: Record<string, string> = {
  privacy: "/privacy",
  terms: "/terms",
  accessibility: "/accessibility",
};

// Query parameters that are safe to keep in a URL. Personal data such as a
// phone number is never put in a URL; see stashPhone below.
const URL_SAFE_PARAMS = new Set(["category", "order", "q"]);

export function viewToHref(view: string, params: Record<string, string> = {}): string {
  let path: string;
  if (view === "policies") {
    path = POLICY_PATHS[params.tab ?? "privacy"] ?? "/privacy";
  } else {
    // Views outside the agreed scope (track, receipt, verify, account) fall back home.
    path = VIEW_PATHS[view] ?? "/";
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (URL_SAFE_PARAMS.has(k) && v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export function pathToView(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (Object.values(POLICY_PATHS).includes(clean)) return "policies";
  // Longest match first so /training/apply wins over /training
  const entries = Object.entries(VIEW_PATHS).sort((a, b) => b[1].length - a[1].length);
  for (const [view, p] of entries) {
    if (p === "/" ? clean === "/" : clean === p || clean.startsWith(p + "/")) return view;
  }
  return "home";
}

// The confirmation screen needs the customer's phone to look up their saved
// request. It travels in sessionStorage for this tab only, never in the URL.
const PHONE_KEY = "als-last-request-phone";

export function stashPhone(phone: string | undefined) {
  if (!phone) return;
  try {
    sessionStorage.setItem(PHONE_KEY, phone);
  } catch {
    /* storage blocked: the confirmation screen asks for the phone instead */
  }
}

export function readStashedPhone(): string {
  try {
    return sessionStorage.getItem(PHONE_KEY) ?? "";
  } catch {
    return "";
  }
}
