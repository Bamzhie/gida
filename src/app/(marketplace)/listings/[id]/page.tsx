import { Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ListingDetailPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Property Details</h1>
      <p className="text-muted-foreground mb-6">
        This page will show full property details.
      </p>
      <Button asChild>
        <Link href="/listings">Back to Listings</Link>
      </Button>
    </div>
  );
}
