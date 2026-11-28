import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "Fish farming guides, fingerling care, cage farming on the Volta and news from Aquatic Link Solutions.",
  alternates: { canonical: "/blog" },
};

// The blog and its admin editor arrive in milestone M4. Until then this page
// says so plainly instead of showing an empty list.
export default function Page() {
  return (
    <section className="container-als section-y">
      <h1 className="text-3xl text-volta sm:text-4xl">Blog</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
        Guides on raising tilapia, caring for fingerlings and farming in cages on the Volta will be published here.
      </p>
      <p className="mx-auto mt-6 max-w-xl leading-relaxed">
        Have a question you would like us to answer?{" "}
        <Link href="/contact" className="font-semibold text-volta underline underline-offset-4">
          Send it to us
        </Link>
        .
      </p>
    </section>
  );
}
