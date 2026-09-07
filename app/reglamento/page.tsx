import type { Metadata } from "next";
import { Check } from "lucide-react";
import { CROSSHERO_URL } from "@shared/domain/policy";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Reglamento",
  description: "Reglamento y políticas de clases, reservas, planes y pagos de Pink Pilates, Reñaca.",
};

const SECCIONES: { titulo: string; texto?: string; puntos?: string[] }[] = [
  {
    titulo: "Clases",
    texto:
      "Las clases se reservan a través de la app CrossHero o por WhatsApp, nuestros canales oficiales.",
    puntos: [
      "Tolerancia de atraso de hasta 10 minutos, mientras dure el calentamiento.",
      "El estudio abre 5 minutos antes del inicio de cada clase.",
      "1 crédito equivale a 1 clase.",
      "Cancela con al menos 3 horas de anticipación para clases de tarde, o 10 horas para clases de mañana.",
      "Se requiere un mínimo de 3 alumnas inscritas para que la clase se realice.",
      "Si no cancelas dentro del plazo, se pierde el crédito correspondiente sin posibilidad de recuperación.",
      "Pink Pilates se reserva el derecho de modificar el horario, avisando con anticipación.",
    ],
  },
  {
    titulo: "Planes",
    puntos: [
      "Los créditos de planes mensuales deben usarse hasta el día 30 o 31 de cada mes.",
      "Los planes trimestrales y semestrales tienen vigencia de 3 a 6 meses desde su activación.",
      "Los créditos no se transfieren entre meses ni entre años.",
      "Los planes no son transferibles a otra persona.",
      "El congelamiento (pausa temporal de hasta 30 días) sólo se acepta con certificado médico.",
      "Las clases no tomadas en fechas de cierre del estudio no son recuperables.",
      "No se hacen excepciones a estas disposiciones.",
    ],
  },
  {
    titulo: "Pagos",
    puntos: [
      "El pago vence el día 1 de cada mes.",
      "La falta de pago libera el cupo reservado.",
      "Las inscripciones a mitad de mes se cobran de forma prorrateada.",
      "Los pagos no son reembolsables bajo ninguna circunstancia.",
    ],
  },
  {
    titulo: "Alumnas embarazadas",
    texto:
      "Para tomar clases durante el embarazo se requiere autorización médica por escrito, con los datos de contacto del médico, certificación de que el embarazo supera las 12 semanas, y el historial de actividad física y del embarazo, incluyendo alergias o lesiones relevantes.",
  },
  {
    titulo: "Protocolo de ingreso",
    puntos: [
      "Sacarse los zapatos al entrar y usar calcetines antideslizantes.",
      "Lavarse las manos antes de la clase.",
      "El uso de toalla personal es obligatorio — sin ella, el estudio puede limitar el ingreso.",
      "Se recomienda traer botella de agua y una toalla de 60×80 cm aprox.",
      "Los cupos se asignan por orden de llegada.",
      "Cada alumna limpia y guarda el equipamiento que usó.",
    ],
  },
  {
    titulo: "Responsabilidad y exención",
    texto:
      "Pink Pilates no asume responsabilidad por daños, lesiones o secuelas derivadas del mal uso del equipamiento, ejecución incorrecta de los ejercicios, omitir el calentamiento, condiciones preexistentes no informadas, o no seguir las instrucciones de la instructora. El Pilates es una actividad físicamente exigente y conlleva riesgo de lesión si no se practica con la condición adecuada. Al participar, autorizas el uso de fotos y videos tomados en el estudio con fines promocionales, sin compensación.",
  },
  {
    titulo: "Confirmación",
    texto:
      "Al reservar una clase confirmas tu mayoría de edad (o autorización de un adulto responsable), y que entiendes y aceptas todos los términos de este reglamento.",
  },
];

export default function ReglamentoPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Reglamento
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">
            Para garantizar un servicio de calidad y una experiencia óptima para todas
          </p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16">
          {SECCIONES.map((s) => (
            <div key={s.titulo} className="mb-10">
              <h2 className="text-[19px] font-semibold text-neutral-900">{s.titulo}</h2>
              {s.texto && s.titulo === "Clases" ? (
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                  Las clases se reservan a través de la app{" "}
                  <a href={CROSSHERO_URL} target="_blank" rel="noreferrer" className="font-medium text-[#FF5C89] hover:underline">
                    CrossHero
                  </a>{" "}
                  o por WhatsApp, nuestros canales oficiales.
                </p>
              ) : (
                s.texto && <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{s.texto}</p>
              )}
              {s.puntos && (
                <ul className="mt-3 grid gap-2">
                  {s.puntos.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[14.5px] leading-relaxed text-neutral-600">
                      <Check size={16} className="mt-0.5 shrink-0 text-[#FF5C89]" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
