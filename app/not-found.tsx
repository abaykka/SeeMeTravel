import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text">
          That globe is not here
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          The link may be mistyped, or the globe may have been removed.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/build" size="lg">
            Build your globe
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
