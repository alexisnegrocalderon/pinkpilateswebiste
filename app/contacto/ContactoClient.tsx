"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { CROSSHERO_URL, STUDIO } from "@shared/domain/policy";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export function ContactoClient() {
  const [f, setF] = useState({ name: "", email: "", phone: "", interest: "", message: "" });
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      await api.post("/public/contact", f);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-[#FFF5F5]">
        <section className="px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Contacto
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">
            Escríbenos y te respondemos a la brevedad — para reservar una clase, hazlo directo en{" "}
            <a href={CROSSHERO_URL} target="_blank" rel="noreferrer" className="font-medium text-[#FF5C89] hover:underline">
              CrossHero
            </a>
            .
          </p>
        </section>

        <div className="mx-auto max-w-md px-5 pb-6 text-center">
          <a
            href={CROSSHERO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full bg-[#FF5C89] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#e14c76]"
          >
            Reservar en CrossHero
          </a>
        </div>

        <div className="mx-auto max-w-md px-5 pb-24">
          {estado === "ok" ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="text-[16px] font-semibold text-neutral-900">¡Gracias por escribir!</p>
              <p className="mt-2 text-[14px] text-neutral-600">Te vamos a responder apenas podamos.</p>
            </div>
          ) : (
            <form onSubmit={enviar} className="grid gap-4 rounded-3xl bg-white p-8 shadow-sm">
              <label className="grid gap-1.5 text-[13.5px] font-medium text-neutral-700">
                Nombre
                <input
                  required
                  className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#FF5C89]"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                />
              </label>
              <label className="grid gap-1.5 text-[13.5px] font-medium text-neutral-700">
                Email
                <input
                  required
                  type="email"
                  className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#FF5C89]"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                />
              </label>
              <label className="grid gap-1.5 text-[13.5px] font-medium text-neutral-700">
                Teléfono (opcional)
                <input
                  className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#FF5C89]"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                />
              </label>
              <label className="grid gap-1.5 text-[13.5px] font-medium text-neutral-700">
                ¿Qué te interesa?
                <input
                  placeholder="Ej: plan mensual, clase de prueba, formación de instructoras"
                  className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#FF5C89]"
                  value={f.interest}
                  onChange={(e) => setF({ ...f, interest: e.target.value })}
                />
              </label>
              <label className="grid gap-1.5 text-[13.5px] font-medium text-neutral-700">
                Mensaje (opcional)
                <textarea
                  rows={4}
                  className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#FF5C89]"
                  value={f.message}
                  onChange={(e) => setF({ ...f, message: e.target.value })}
                />
              </label>

              {estado === "error" && (
                <p className="text-[13.5px] text-red-600">No pudimos enviar tu mensaje. Intenta de nuevo.</p>
              )}

              <button
                type="submit"
                disabled={estado === "enviando"}
                className="mt-1 rounded-full bg-[#FF5C89] px-6 py-3 text-[14px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#e14c76] disabled:opacity-60"
              >
                {estado === "enviando" ? "Enviando…" : "Enviar"}
              </button>

              <p className="text-center text-[13px] text-neutral-500">
                También puedes escribirnos por{" "}
                <a href={`https://wa.me/${STUDIO.phone.replace("+", "")}`} className="font-medium text-[#FF5C89] hover:underline">
                  WhatsApp
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
