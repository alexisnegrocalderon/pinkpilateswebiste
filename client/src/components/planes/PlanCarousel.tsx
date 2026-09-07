import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { PlanCard, type Plan } from "./PlanCard";

export function PlanCarousel({
  plans,
  loggedIn,
  onComprar,
}: {
  plans: Plan[];
  loggedIn: boolean;
  onComprar: (p: Plan) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [seleccionado, setSeleccionado] = useState(0);

  useEffect(() => {
    if (!api) return;
    setSeleccionado(api.selectedScrollSnap());
    api.on("select", () => setSeleccionado(api.selectedScrollSnap()));
    api.on("reInit", () => setSeleccionado(api.selectedScrollSnap()));
  }, [api]);

  // El plan destacado (con badge) va primero — es la señal "más popular".
  const ordenados = [...plans].sort((a, b) => Number(!a.badge) - Number(!b.badge));

  return (
    <div>
      <Carousel opts={{ align: "start" }} setApi={setApi} className="w-full">
        <CarouselContent>
          {ordenados.map((p) => (
            <CarouselItem key={p.id} className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
              <PlanCard plan={p} loggedIn={loggedIn} onComprar={onComprar} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Plan anterior"
          onClick={() => api?.scrollPrev()}
          disabled={!api?.canScrollPrev()}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition-colors hover:border-[#FF5C89] hover:text-[#FF5C89] disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1.5">
          {ordenados.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Ir al plan ${p.name}`}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === seleccionado ? "w-5 bg-[#FF5C89]" : "w-2 bg-[#FFDBDB]"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Plan siguiente"
          onClick={() => api?.scrollNext()}
          disabled={!api?.canScrollNext()}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition-colors hover:border-[#FF5C89] hover:text-[#FF5C89] disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
