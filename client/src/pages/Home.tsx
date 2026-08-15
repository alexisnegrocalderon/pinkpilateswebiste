/**
 * Pink Pilates — Pink, Unleashed
 * Experiencia digital de alto voltaje: monograma monumental, rosa magenta,
 * reticulado visible y capas de contenido diseñadas para sentirse físicas.
 */
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  MoveDown,
  Plus,
  X,
} from "lucide-react";

const wordmarkLogo = "/assets/pink/pink-pilates-wordmark-bubblegum.png";
const heartMark = "/assets/pink/pink-pilates-heart-bubblegum.png";
const originalLoaderHeart = "/assets/pink/pink-pilates-heart-bubblegum.png";
const heroImage = "/assets/pink/pink-riot-hero.jpg";
const motionImage = "/assets/pink/pink-riot-motion-v2.jpg";
const studioImage = "/assets/pink/pink-riot-studio-v2.jpg";
const objectsImage = "/assets/pink/pink-riot-objects-v2.jpg";

const sparks = [
  { index: "01", primary: "Mueve", accent: "fuerte.", copy: "Reformer y apparatus para una fuerza que se construye desde adentro.", tag: "STUDIO PILATES" },
  { index: "02", primary: "Rompe", accent: "rituales.", copy: "Barre, mat y entrenamiento con actitud para tus días de otra energía.", tag: "PINK MOVES" },
  { index: "03", primary: "Hazlo", accent: "tuyo.", copy: "Tu ritmo, tu momento y un equipo que sabe acompañarte sin solemnidad.", tag: "CLASES A TU MEDIDA" },
];

const heroLines = [
  { kicker: "Técnica + actitud / Reñaca", lineOne: "Mueve el", lineTwo: "cuerpo que", accent: "te habita.", caption: "Pilates sin piloto automático. Entra, toma espacio y sal vibrando distinto." },
  { kicker: "El estudio que no se queda quieto", lineOne: "Hazlo", lineTwo: "fuerte.", accent: "Hazlo Pink.", caption: "Tu cuerpo no es un proyecto de mejora. Es el lugar donde empieza todo." },
  { kicker: "Aparatos, precisión y una dosis de locura", lineOne: "Suda.", lineTwo: "Sonríe.", accent: "Repite.", caption: "Clases personalizadas, energía real y cero vibra de gimnasio genérico." },
];

// Datos de interfaz temporales: el proveedor de agenda reemplazará estas listas por datos reales.
const bookingClasses = [
  { id: "studio", label: "Studio Pilates", note: "Reformer + apparatus" },
  { id: "barre", label: "Barre & Mat", note: "Fuerza + flow" },
  { id: "pinkmoves", label: "Pink Moves", note: "Energía + ritmo" },
];

const bookingDays = ["LUN", "MAR", "MIÉ", "JUE", "VIE"];
const bookingTimes = ["08:30", "10:00", "12:30", "17:15", "19:00"];

function Mark({ inverse = false }: { inverse?: boolean }) {
  if (!inverse) {
    return (
      <a className="riot-mark riot-mark-original" href="#inicio" aria-label="Pink Pilates Studio, volver al inicio">
        <span className="riot-wordmark-crop"><img src={wordmarkLogo} alt="Pink Pilates Studio" /></span>
      </a>
    );
  }

  return (
    <a className="riot-mark riot-mark-inverse" href="#inicio" aria-label="Pink Pilates, volver al inicio">
      <img className="riot-heart-mark" src={heartMark} alt="" />
      <span><b>Pink</b><i>Pilates</i></span>
    </a>
  );
}

function CircleButton({
  label,
  onClick,
  children,
  dark = false,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <button type="button" className={`circle-button ${dark ? "circle-button-dark" : ""}`} onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [selectedSpark, setSelectedSpark] = useState(0);
  const [bookingClass, setBookingClass] = useState("studio");
  const [bookingDay, setBookingDay] = useState("LUN");
  const [bookingTime, setBookingTime] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const hero = heroLines[selectedSlide];
  const chosenClass = bookingClasses.find((item) => item.id === bookingClass) ?? bookingClasses[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 46);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setIsLoading(false), prefersReducedMotion ? 120 : 1750);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isLoading]);

  const slideHero = (direction: -1 | 1) => {
    setSelectedSlide((current) => (current + direction + heroLines.length) % heroLines.length);
  };

  return (
    <div className="riot-site">
      <div className={`pink-loader ${isLoading ? "pink-loader-active" : "pink-loader-leave"}`} aria-hidden={!isLoading} role="status" aria-label="Cargando Pink Pilates">
        <div className="pink-loader-grid" aria-hidden="true" />
        <div className="pink-loader-ghost" aria-hidden="true">PINK<br />PILATES</div>
        <div className="pink-loader-arc pink-loader-arc-one" aria-hidden="true" />
        <div className="pink-loader-arc pink-loader-arc-two" aria-hidden="true" />
        <div className="pink-loader-core">
          <div className="pink-loader-heart"><span className="pink-loader-aura" /><img src={originalLoaderHeart} alt="" /></div>
          <p><b>ENTRA EN</b> TU ENERGÍA<br /><span>REÑACA · CHILE / PILATES CON PULSO</span></p>
        </div>
        <div className="pink-loader-meta"><span>NO BAJES EL VOLUMEN</span><span>01 / 01</span></div>
      </div>
      <header className={`riot-header ${scrolled ? "riot-header-scrolled" : ""}`}>
        <Mark />
        <div className="riot-header-meta"><span>REÑACA, CHILE</span><span>33°01'S · 71°33'W</span></div>
        <button type="button" className="riot-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir navegación">
          <small>00</small><span>MENÚ</span><Menu size={20} strokeWidth={2.4} />
        </button>
      </header>

      <div className={`riot-menu-layer ${menuOpen ? "riot-menu-layer-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="menu-grid-line" />
        <div className="menu-topline">
          <Mark inverse />
          <button type="button" className="menu-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar navegación"><X size={27} /></button>
        </div>
        <nav className="riot-navigation" aria-label="Navegación principal">
          {[
            ["01", "El manifiesto", "#manifiesto"],
            ["02", "Clases", "#clases"],
            ["03", "Agenda", "#reserva"],
            ["04", "El estudio", "#estudio"],
          ].map(([number, label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}>
              <small>{number}</small><span>{label}</span><ArrowUpRight size={29} />
            </a>
          ))}
        </nav>
        <div className="menu-bottomline"><span>Instagram @pinkpilates</span><span>ANGAMOS 326 · REÑACA</span></div>
      </div>

      <main>
        <section className="riot-hero" id="inicio">
          <div className="hero-grid vertical-grid" />
          <div className="hero-mega-p" aria-hidden="true">P</div>
          <div className="hero-symbol-system"><img src={heartMark} alt="" /><span>PINK · PRECISO · SALVAJE · REÑACA ·</span></div>
          <div className="hero-corner hero-corner-top">PINK PILATES®<br />EST. REÑACA</div>
          <div className="hero-copy">
            <p className="riot-kicker"><i /> {hero.kicker}</p>
            <h1>
              <span>{hero.lineOne}</span>
              <span>{hero.lineTwo}</span>
              <em>{hero.accent}</em>
            </h1>
            <p className="hero-caption">{hero.caption}</p>
          </div>
          <div className="hero-visual">
            <div className="hero-image-frame"><img src={heroImage} alt="Mujer disfrutando una clase de Pink Pilates" /></div>
            <div className="hero-image-lapel">MÁS<br />CUERPO<br />MENOS</div>
            <div className="hero-visual-tag">PINK ES<br />UN<br />ESTADO</div>
          </div>
          <div className="hero-apparatus-note">REFORMER / CHAIR / TOWER / MAT<br />PILATES PERSONALIZADO</div>
          <div className="hero-controller">
            <span>{String(selectedSlide + 1).padStart(2, "0")} / 03</span>
            <div><CircleButton label="Diapositiva anterior" onClick={() => slideHero(-1)}><ChevronLeft size={18} /></CircleButton><CircleButton label="Siguiente diapositiva" onClick={() => slideHero(1)}><ChevronRight size={18} /></CircleButton></div>
          </div>
          <a className="hero-down" href="#manifiesto"><span>BAJA SIN PRISA</span><MoveDown size={19} /></a>
          <div className="hero-edge-copy">PILATES · PERSONALIZADO · ENERGÍA · ACTITUD ·</div>
        </section>

        <section className="riot-manifesto" id="manifiesto">
          <div className="manifesto-top"><span>MANIFIESTO 001</span><span>NO VENIMOS A QUEDARNOS QUIETAS</span></div>
          <div className="manifesto-punch">
            <p>Tu práctica no tiene que ser silenciosa para ser profunda.</p>
            <h2><span>Menos</span><em>reglas.</em><br /><strong>Más</strong> cuerpo.</h2>
            <p>Pink es técnica con música alta. Concentración con risa. Precisión con una energía que no se puede fingir.</p>
          </div>
          <img className="manifesto-heart-mark" src={heartMark} alt="" aria-hidden="true" />
          <div className="manifesto-scroll" aria-hidden="true"><span>NO BAJES EL VOLUMEN · SUBE LA FUERZA · NO BAJES EL VOLUMEN ·</span></div>
        </section>

        <section className="riot-sparks" id="clases">
          <header className="sparks-header"><span>02 / ELIGE TU PINK</span><h2>Clases con<br /><em>pulso propio.</em></h2><span>PRESIONA UNA PARA ACTIVAR</span></header>
          <div className="spark-list">
            {sparks.map((spark, index) => (
              <button type="button" key={spark.index} className={`spark-row ${selectedSpark === index ? "spark-row-active" : ""}`} onClick={() => setSelectedSpark(index)}>
                <span className="spark-index">{spark.index}</span>
                <span className="spark-title">{spark.primary} <em>{spark.accent}</em></span>
                <span className="spark-copy">{spark.copy}</span>
                <span className="spark-tag">{spark.tag}</span>
                <span className="spark-plus"><Plus size={25} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="riot-motion-block">
          <div className="motion-word">VIVA</div>
          <div className="motion-picture"><img src={motionImage} alt="Movimiento energético durante una clase de Pilates" /></div>
          <div className="motion-stamp">RESPIRA<br />Y <b>ROMPE</b><br />EL LOOP</div>
          <div className="motion-note">LA FUERZA SE VE<br />CUANDO TE MUEVES.</div>
          <div className="motion-wheel"><span>EFECTO PINK · EFECTO PINK ·</span><b>↘</b></div>
        </section>

        <section className="riot-studio" id="estudio">
          <div className="studio-grid vertical-grid" />
          <div className="studio-intro"><span>03 / EL ESTUDIO</span><h2>No es un<br /><em>gimnasio.</em><br />Es nuestro<br />territorio.</h2><p className="studio-founder">Javiera De La Torre Vio dirige cada sesión con técnica, atención real y ese impulso Pink que se nota al entrar.</p></div>
          <div className="studio-image"><img src={studioImage} alt="Interior expresivo del estudio de Pink Pilates" /><span>ANGAMOS 326 / REÑACA</span></div>
          <div className="studio-specs"><p>Reformer, Chair, Tower, Ladder Barrel, Mat y un equipo que mira los detalles.</p><a href="#reserva">ENTRA AL MUNDO PINK <ArrowDownRight size={17} /></a></div>
          <div className="studio-burst" aria-hidden="true">P</div>
        </section>

        <section className="riot-object-block">
          <div className="object-copy"><p>OBJETOS CON INTENCIÓN / CUERPO CON AGENCIA</p><h2>Tu método.<br /><em>Tu caos.</em><br />Tu centro.</h2><span>NO HAY DOS CUERPOS IGUALES.<br />OBVIO QUE NO HAY DOS CLASES IGUALES.</span></div>
          <div className="object-picture"><img src={objectsImage} alt="Objetos de Pilates en rosa, cromo y amarillo" /></div>
          <div className="object-tape">SENTIR. HABITAR. REPETIR.</div>
        </section>

        <section className="riot-reserve" id="reserva">
          <div className="reserve-grid vertical-grid" />
          <div className="reserve-top"><span>04 / AGENDA PINK</span><span>ELIGE TU MOMENTO · LO DEMÁS LO CONECTAMOS</span></div>
          <div className="reserve-main">
            <div className="reserve-title"><h2>Tu hora<br />feliz empieza<br />en el <em>reformer.</em></h2><p>Una interfaz preparada para conectar disponibilidad, instructoras, pagos y confirmaciones cuando elijas el motor de reservas.</p></div>
            <div className={`booking-interface ${bookingConfirmed ? "booking-interface-confirmed" : ""}`}>
              {bookingConfirmed ? (
                <div className="booking-confirmation">
                  <span className="booking-confirmation-mark">P</span>
                  <p className="booking-overline">SELECCIÓN LISTA</p>
                  <h3>{chosenClass.label}<br /><em>{bookingDay} · {bookingTime}</em></h3>
                  <p>Tu selección quedó preparada para pasar a la agenda real. Cuando conectemos el sistema, este paso confirmará cupo, instructora y pago.</p>
                  <button type="button" className="booking-reset" onClick={() => { setBookingConfirmed(false); setBookingTime(null); }}>Editar selección <ArrowUpRight size={16} /></button>
                </div>
              ) : (
                <>
                  <div className="booking-interface-head"><span>RESERVA / BETA INTERFACE</span><span>01 — 03</span></div>
                  <div className="booking-step">
                    <div className="booking-step-title"><b>01</b><span>Elige tu clase</span></div>
                    <div className="booking-class-options">
                      {bookingClasses.map((item) => (
                        <button type="button" key={item.id} className={bookingClass === item.id ? "booking-class active" : "booking-class"} onClick={() => { setBookingClass(item.id); setBookingConfirmed(false); }} aria-pressed={bookingClass === item.id}>
                          <span>{item.label}</span><small>{item.note}</small><i>↗</i>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="booking-step booking-step-compact">
                    <div className="booking-step-title"><b>02</b><span>Elige un día</span></div>
                    <div className="booking-day-options">
                      {bookingDays.map((day, index) => (
                        <button type="button" key={day} onClick={() => { setBookingDay(day); setBookingConfirmed(false); }} className={bookingDay === day ? "booking-day active" : "booking-day"} aria-pressed={bookingDay === day}><span>{day}</span><small>{String(index + 1).padStart(2, "0")}</small></button>
                      ))}
                    </div>
                  </div>
                  <div className="booking-step booking-step-compact">
                    <div className="booking-step-title"><b>03</b><span>Elige un bloque</span></div>
                    <div className="booking-time-options">
                      {bookingTimes.map((time) => (
                        <button type="button" key={time} className={bookingTime === time ? "booking-time active" : "booking-time"} onClick={() => { setBookingTime(time); setBookingConfirmed(false); }} aria-pressed={bookingTime === time}>{time}</button>
                      ))}
                    </div>
                  </div>
                  <div className="booking-action-row"><p>HORARIOS DE REFERENCIA. LA DISPONIBILIDAD REAL SE ACTIVARÁ AL CONECTAR LA AGENDA.</p><button type="button" className="booking-confirm" disabled={!bookingTime} onClick={() => setBookingConfirmed(true)}><span>PREPARAR RESERVA</span><ArrowUpRight size={20} /></button></div>
                </>
              )}
            </div>
          </div>
          <div className="reserve-ring reserve-ring-one" /><div className="reserve-ring reserve-ring-two" />
          <div className="reserve-number" aria-hidden="true">01</div>
        </section>
      </main>

      <a className="mobile-booking-dock" href="#reserva" aria-label="Ir a la agenda de Pink Pilates">
        <span><i>04</i> AGENDA PINK</span><b>RESERVAR <ArrowUpRight size={16} /></b>
      </a>

      <footer className="riot-footer">
        <div className="footer-main"><Mark inverse /><p>Javiera y el equipo Pink te esperan para moverte con técnica, energía y mucha personalidad.</p><a href="mailto:contacto@pinkpilates.cl">contacto@pinkpilates.cl <ArrowUpRight size={16} /></a></div>
        <div className="footer-meta"><span>© 2026 PINK PILATES</span><span>REÑACA · VIÑA DEL MAR · CHILE</span><a href="#inicio">ARRIBA ↑</a></div>
      </footer>
    </div>
  );
}
