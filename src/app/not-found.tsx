import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-6xl text-primary-30">404</h1>
        <h2 className="text-2xl font-medium text-primary-20">
          Sidan hittades inte
        </h2>
        <p className="text-primary-15">
          Vi kunde tyvärr inte hitta sidan du letar efter. Den kan ha flyttats,
          tagits bort, eller så har du skrivit in fel adress.
        </p>
        <div className="pt-6">
          <Link href="/" passHref>
            <Button className="gap-2">
              <ArrowLeft size={16} />
              Tillbaka till startsidan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
