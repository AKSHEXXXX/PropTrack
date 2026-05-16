import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, Users, TrendingUp, LayoutDashboard, ArrowRight, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-6 text-foreground" />
            <span className="text-lg font-semibold tracking-tight">PropTrack</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#benefits" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Benefits
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-foreground" />
            Built for Dubai Real Estate Agencies
          </div>
          <h1 className="mb-6 text-balance text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            Real Estate CRM for Growing Agencies
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Manage your properties, track leads through every stage, and close more deals. 
            PropTrack gives you the tools to run your agency efficiently without the complexity.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="min-w-[160px]">
              <Link href="/register">
                Start Free Trial
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="min-w-[160px]">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-card px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight">Everything You Need</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              From lead capture to deal closing, PropTrack handles your entire sales pipeline
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<LayoutDashboard className="size-5" />}
              title="Pipeline Management"
              description="Visual Kanban board to track every lead from first contact to closed deal. Never lose track of a potential sale."
            />
            <FeatureCard
              icon={<Building2 className="size-5" />}
              title="Property Listings"
              description="Centralized property database with all details, images, and status tracking. Filter and find listings instantly."
            />
            <FeatureCard
              icon={<TrendingUp className="size-5" />}
              title="Agent Performance"
              description="Track conversion rates, active deals, and commission earnings. Identify your top performers at a glance."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-semibold tracking-tight">
                Built for Small to Mid-Size Agencies
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                {"We've"} stripped away the complexity of enterprise CRMs to give you exactly what you need. 
                No training required — your team can start using PropTrack on day one.
              </p>
              <ul className="space-y-4">
                <BenefitItem text="Clean, intuitive interface anyone can use" />
                <BenefitItem text="Mobile-friendly for agents on the go" />
                <BenefitItem text="Real-time updates across your entire team" />
                <BenefitItem text="Secure data with role-based access" />
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-8">
              <div className="mb-6 flex items-center gap-4">
                <Users className="size-8 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-semibold">500+</div>
                  <div className="text-sm text-muted-foreground">Agencies Trust PropTrack</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <StatItem value="2.5x" label="Faster Deal Closure" />
                <StatItem value="40%" label="More Leads Converted" />
                <StatItem value="3hrs" label="Saved Per Day" />
                <StatItem value="99.9%" label="Uptime Guaranteed" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight">
            Ready to Grow Your Agency?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join hundreds of real estate agencies already using PropTrack to close more deals.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              Get Started Free
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">PropTrack CRM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PropTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="mb-4 inline-flex items-center justify-center rounded-md border border-border bg-card p-2.5">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle2 className="size-5 shrink-0 text-foreground" />
      <span>{text}</span>
    </li>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
