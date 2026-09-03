/**
 * Datos reales de Pink Pilates, tomados de pinkpilates.cl.
 * Los precios y la estructura de créditos son los publicados por el estudio.
 */

export const ROOMS = [
  // La capacidad sale del equipamiento real: "5 reformers, 4 Unit wall, Chair, Mat".
  { name: "Sala Reformer", capacity: 5, description: "5 reformers", location: "Angamos 326, Reñaca" },
  { name: "Sala Wall & Chair", capacity: 4, description: "4 wall units, Chair, Ladder Barrel", location: "Angamos 326, Reñaca" },
  { name: "Sala Mat & Barré", capacity: 14, description: "Mat 15mm, barras, bandas, mancuernas", location: "Angamos 326, Reñaca" },
] as const;

export const CLASS_TYPES = [
  { slug: "studio-pilates", name: "Studio Pilates", discipline: "apparatus", level: "all_levels", capacity: 5, price: 18000, color: "#FF5C89", room: "Sala Reformer",
    short: "Reformer y apparatus", desc: "Trabajo en reformer con precisión y carga progresiva. Fuerza que se construye desde adentro." },
  { slug: "wall-chair", name: "Wall Unit & Chair", discipline: "apparatus", level: "intermediate", capacity: 4, price: 18000, color: "#FB8CAC", room: "Sala Wall & Chair",
    short: "Torre, chair y ladder barrel", desc: "Apparatus completo para quienes ya dominan la base y quieren más desafío." },
  { slug: "mat-pilates", name: "Mat Pilates", discipline: "mat", level: "all_levels", capacity: 14, price: 9000, color: "#FDA8BF", room: "Sala Mat & Barré",
    short: "Suelo, balón y bandas", desc: "El método clásico en colchoneta, con implementos para subir la intensidad." },
  { slug: "barre", name: "Barré", discipline: "barre", level: "all_levels", capacity: 14, price: 9000, color: "#FDC3D1", room: "Sala Mat & Barré",
    short: "Fuerza + flow", desc: "Barra, repetición y resistencia. Piernas y core ardiendo, con música arriba." },
  { slug: "baile-entretenido", name: "Baile Entretenido", discipline: "dance", level: "all_levels", capacity: 14, price: 8000, color: "#FF5C89", room: "Sala Mat & Barré",
    short: "Energía + ritmo", desc: "Cardio sin cara de gimnasio. Se viene a sudar y a pasarlo bien." },
  { slug: "pilates-embarazo", name: "Pilates Embarazo", discipline: "prenatal", level: "intro", capacity: 4, price: 18000, color: "#FDC3D1", room: "Sala Wall & Chair",
    short: "Acompañamiento prenatal", desc: "Trabajo adaptado por trimestre, con foco en piso pélvico y respiración." },
  { slug: "adulto-mayor", name: "Pilates Adulto Mayor", discipline: "senior", level: "intro", capacity: 5, price: 18000, color: "#FDA8BF", room: "Sala Reformer",
    short: "Movilidad y equilibrio", desc: "Ritmo pausado, foco en movilidad articular, equilibrio y autonomía." },
  { slug: "vals-novios", name: "Vals Novios", discipline: "bridal", level: "intro", capacity: 2, price: 40000, color: "#FF5C89", room: "Sala Mat & Barré",
    short: "Coreografía para el gran día", desc: "Clases privadas para preparar el primer baile, solas o en pareja." },
] as const;

/**
 * Matriz real de planes: segmento × periodicidad × créditos.
 * "1 Crédito es el equivalente a 1 clase". Sin congelamiento en ningún plan.
 */
export const PLANS = [
  // --- Adultos ---
  { slug: "adulto-mensual-1",  name: "Clase suelta",           segment: "adult", months: 1, credits: 1,   price: 18000,   dropIn: true },
  { slug: "adulto-mensual-4",  name: "Adulto Mensual 4",       segment: "adult", months: 1, credits: 4,   price: 55000 },
  { slug: "adulto-mensual-8",  name: "Adulto Mensual 8",       segment: "adult", months: 1, credits: 8,   price: 96000, badge: "Más elegido" },
  { slug: "adulto-mensual-12", name: "Adulto Mensual 12",      segment: "adult", months: 1, credits: 12,  price: 150000 },
  { slug: "adulto-trim-24",    name: "Adulto Trimestral 24",   segment: "adult", months: 3, credits: 24,  price: 279000 },
  { slug: "adulto-trim-36",    name: "Adulto Trimestral 36",   segment: "adult", months: 3, credits: 36,  price: 414000 },
  { slug: "adulto-sem-48",     name: "Adulto Semestral 48",    segment: "adult", months: 6, credits: 48,  price: 504000 },
  { slug: "adulto-sem-72",     name: "Adulto Semestral 72",    segment: "adult", months: 6, credits: 72,  price: 738000 },
  { slug: "adulto-anual-96",   name: "Adulto Anual 96",        segment: "adult", months: 12, credits: 96,  price: 924000 },
  { slug: "adulto-anual-144",  name: "Adulto Anual 144",       segment: "adult", months: 12, credits: 144, price: 1344000 },
  { slug: "adulto-anual-200",  name: "Adulto Anual 200",       segment: "adult", months: 12, credits: 200, price: 1600000 },

  // --- Estudiantes (exigen certificado de alumno regular) ---
  { slug: "est-mensual-8",   name: "Estudiante Mensual 8",     segment: "student", months: 1, credits: 8,   price: 75000,  verify: true },
  { slug: "est-mensual-12",  name: "Estudiante Mensual 12",    segment: "student", months: 1, credits: 12,  price: 113000, verify: true },
  { slug: "est-trim-24",     name: "Estudiante Trimestral 24", segment: "student", months: 3, credits: 24,  price: 213000, verify: true },
  { slug: "est-trim-36",     name: "Estudiante Trimestral 36", segment: "student", months: 3, credits: 36,  price: 321000, verify: true },
  { slug: "est-sem-48",      name: "Estudiante Semestral 48",  segment: "student", months: 6, credits: 48,  price: 414000, verify: true },
  { slug: "est-sem-72",      name: "Estudiante Semestral 72",  segment: "student", months: 6, credits: 72,  price: 612000, verify: true },
  { slug: "est-anual-96",    name: "Estudiante Anual 96",      segment: "student", months: 12, credits: 96,  price: 804000, verify: true },
  { slug: "est-anual-144",   name: "Estudiante Anual 144",     segment: "student", months: 12, credits: 144, price: 1200000, verify: true },

  // --- Valle: sólo lunes a viernes, 15:00 / 16:00 / 17:00 ---
  { slug: "valle-4",  name: "Valle 4",  segment: "valle", months: 1, credits: 4,  price: 40000, valle: true },
  { slug: "valle-8",  name: "Valle 8",  segment: "valle", months: 1, credits: 8,  price: 65000, valle: true, badge: "Mejor precio" },
  { slug: "valle-12", name: "Valle 12", segment: "valle", months: 1, credits: 12, price: 96000, valle: true },

  // --- Especiales: acotados a un solo tipo de clase ---
  { slug: "baile-4",  name: "Baile Entretenido 4",  segment: "special", months: 1, credits: 4, price: 32000, only: "baile-entretenido" },
  { slug: "baile-8",  name: "Baile Entretenido 8",  segment: "special", months: 1, credits: 8, price: 48000, only: "baile-entretenido" },
  { slug: "mat-8",    name: "Mat Pilates 8",        segment: "special", months: 1, credits: 8, price: 56000, only: "mat-pilates" },
  { slug: "vals-1",   name: "Vals Novios (1 clase)", segment: "special", months: 1, credits: 1, price: 40000, only: "vals-novios" },
  { slug: "vals-full", name: "Vals Novios (coreografía completa)", segment: "special", months: 3, credits: 10, price: 400000, only: "vals-novios" },
] as const;

/** Horario semanal. weekday: 1=lunes .. 6=sábado. Sin choques de sala. */
export const TEMPLATES = [
  // Sala Reformer — Studio Pilates. Incluye la franja valle 15/16/17h.
  ...[1, 2, 3, 4, 5].flatMap((d) =>
    ["08:00", "09:00", "10:00", "15:00", "16:00", "17:00", "19:00"].map((t) => ({
      classType: "studio-pilates", weekday: d, time: t,
    })),
  ),
  // Sala Reformer — adulto mayor a media mañana, cuando el estudio está tranquilo.
  ...[2, 4].map((d) => ({ classType: "adulto-mayor", weekday: d, time: "11:30" })),
  ...[1, 3, 5].map((d) => ({ classType: "studio-pilates", weekday: d, time: "11:30" })),
  { classType: "studio-pilates", weekday: 6, time: "09:00" },
  { classType: "studio-pilates", weekday: 6, time: "10:00" },

  // Sala Wall & Chair
  ...[1, 3, 5].map((d) => ({ classType: "wall-chair", weekday: d, time: "09:00" })),
  ...[2, 4].map((d) => ({ classType: "wall-chair", weekday: d, time: "19:00" })),
  ...[2, 4].map((d) => ({ classType: "pilates-embarazo", weekday: d, time: "16:00" })),

  // Sala Mat & Barré
  ...[1, 3].map((d) => ({ classType: "barre", weekday: d, time: "18:00" })),
  ...[2, 4].map((d) => ({ classType: "mat-pilates", weekday: d, time: "18:00" })),
  ...[1, 3, 5].map((d) => ({ classType: "baile-entretenido", weekday: d, time: "20:00" })),
  { classType: "barre", weekday: 6, time: "11:00" },
] as const;

export const INSTRUCTORS = [
  { first: "Javiera", last: "De La Torre", email: "javiera@pinkpilates.cl", color: "#FF5C89",
    bio: "Directora de Pink Pilates. Formadora de instructoras y especialista en apparatus.",
    specialties: ["apparatus", "mat", "teacher_training"] },
  { first: "Antonia", last: "Vergara", email: "antonia@pinkpilates.cl", color: "#FB8CAC",
    bio: "Barré y acondicionamiento. Le gusta la música fuerte y las series largas.",
    specialties: ["barre", "dance", "mat"] },
  { first: "Camila", last: "Ruiz-Tagle", email: "camila@pinkpilates.cl", color: "#FDA8BF",
    bio: "Pilates prenatal y adulto mayor. Trabajo pausado, preciso y muy acompañado.",
    specialties: ["prenatal", "senior", "apparatus"] },
] as const;

/** Nombres chilenos para que la demo no se vea como una base de pruebas. */
export const STUDENT_NAMES = [
  ["Constanza", "Valdés"], ["Fernanda", "Espinoza"], ["Catalina", "Muñoz"], ["Josefa", "Contreras"],
  ["Isidora", "Larraín"], ["Martina", "Rojas"], ["Antonia", "Fuentes"], ["Emilia", "Sepúlveda"],
  ["Florencia", "Cáceres"], ["Trinidad", "Undurraga"], ["Magdalena", "Errázuriz"], ["Rocío", "Bustos"],
  ["Valentina", "Tapia"], ["Amanda", "Guzmán", ], ["Sofía", "Miranda"], ["Agustina", "Navarrete"],
  ["Paula", "Herrera"], ["Daniela", "Cortés"], ["Macarena", "Pizarro"], ["Ignacia", "Salinas"],
  ["Carolina", "Vergara"], ["Andrea", "Riquelme"], ["Pía", "Donoso"], ["Bárbara", "Alarcón"],
  ["Javiera", "Soto"], ["Manuela", "Cifuentes"], ["Renata", "Aguilera"], ["Elisa", "Peña"],
  ["Laura", "Venegas"], ["Blanca", "Ossandón"], ["Rosario", "Vial"], ["Teresita", "Amunátegui"],
  ["Colomba", "Prieto"], ["Maite", "Zúñiga"], ["Amaia", "Correa"],
] as const;
