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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative space-y-6 max-w-md animate-in fade-in zoom-in duration-500">
          <div className="h-20 w-20 mx-auto rounded-3xl bg-red-500/10 flex items-center justify-center mb-8">
            <div className="h-4 w-10 bg-red-500/40 rounded-full rotate-45" />
            <div className="h-4 w-10 bg-red-500/40 rounded-full -rotate-45 -ml-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Invalid Link</h1>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            The link you're trying to access is invalid or has expired. Please
            check with the quest creator.
          </p>
          <div className="pt-8">
            <Link href="/">
              <Button
                variant="outline"
                className="px-8 h-12 rounded-full font-bold transition-all hover:bg-muted"
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
