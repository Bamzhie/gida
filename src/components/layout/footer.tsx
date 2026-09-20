import Link from "next/link";
import { Building2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50 mt-8">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-heading font-semibold text-xl">
              <Building2 className="h-6 w-6" />
              <span>Gida</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A property marketplace built for Nigeria. Live in Lagos for now, with more of the
              country on the way.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Quick links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/listings" className="hover:text-foreground">Browse listings</Link></li>
              <li><Link href="/agents" className="hover:text-foreground">Find agents</Link></li>
              <li><Link href="/register" className="hover:text-foreground">List your property</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Where we cover</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                Lagos
                <span className="text-xs rounded-full bg-accent/15 text-accent px-2 py-0.5">Live</span>
              </li>
              <li className="flex items-center gap-2">
                Abuja
                <span className="text-xs rounded-full bg-muted text-muted-foreground px-2 py-0.5">Coming soon</span>
              </li>
              <li className="flex items-center gap-2">
                Port Harcourt
                <span className="text-xs rounded-full bg-muted text-muted-foreground px-2 py-0.5">Coming soon</span>
              </li>
              <li className="flex items-center gap-2">
                Ibadan
                <span className="text-xs rounded-full bg-muted text-muted-foreground px-2 py-0.5">Coming soon</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Help centre</li>
              <li>Contact us</li>
              <li>Terms of service</li>
              <li>Privacy policy</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gida. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
