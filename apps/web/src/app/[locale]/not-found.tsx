import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md place-items-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <p className="text-muted-foreground">This page could not be found.</p>
      <Link href="/">
        <Button>Atria</Button>
      </Link>
    </div>
  );
}
