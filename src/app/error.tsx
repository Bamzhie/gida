"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="pt-10 pb-10">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="font-heading text-xl font-semibold">This page could not be loaded</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The marketplace service could not be reached. Your search and saved properties are unchanged.
          </p>
          <span className="sr-only">{error.digest}</span>
          <Button className="mt-5" onClick={retry}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
