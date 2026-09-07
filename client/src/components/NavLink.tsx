import type { AnchorHTMLAttributes } from "react";

/**
 * Reemplazo de `Link` de wouter para navegación que cruza hacia otra ruta de
 * Next.js (fuera del catch-all de wouter donde vive el componente actual).
 *
 * El `Link` de wouter intercepta el click y hace pushState: cambia la URL
 * pero, al no ser parte del App Router de Next, Next nunca se entera de que
 * debe renderizar la página nueva — queda la pantalla vieja con la URL
 * cambiada. Un <a> normal fuerza una navegación real, que sí dispara Next.
 */
export function Link({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={href} {...props} />;
}
