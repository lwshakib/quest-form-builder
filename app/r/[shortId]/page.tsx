import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ShortRedirectPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;

  const quest = await prisma.quest.findUnique({
    where: { shortId },
  });

  if (!quest) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="animate-in fade-in zoom-in relative max-w-md space-y-6 duration-500">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10">
            <div className="h-4 w-10 rotate-45 rounded-full bg-red-500/40" />
            <div className="-ml-10 h-4 w-10 -rotate-45 rounded-full bg-red-500/40" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Invalid Link</h1>
          <p className="text-muted-foreground text-lg leading-relaxed font-medium">
            The link you&apos;re trying to access is invalid or has expired. Please check with the
            quest creator.
          </p>
          <div className="pt-8">
            <Link href="/">
              <Button
                variant="outline"
                className="hover:bg-muted h-12 rounded-full px-8 font-bold transition-all"
              >
                Go home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to the long share URL
  redirect(`/share/${quest.id}`);
}
