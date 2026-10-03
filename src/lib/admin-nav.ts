import {
  BriefcaseBusiness,
  BusFront,
  CalendarClock,
  ChefHat,
  FileText,
  LayoutDashboard,
  ListChecks,
  Map as MapIcon,
  Music4,
  Search,
  Settings,
  Table2,
  Users,
  UsersRound,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavGroup = "Resumen" | "Invitados" | "Logística" | "Operaciones";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  grupo: AdminNavGroup;
  /** Aparece como acción primaria en la barra inferior móvil. */
  enBottomNav: boolean;
  /** Aparece en la hoja «Más» del móvil (secciones secundarias). */
  enMoreSheet: boolean;
};

/** Orden canónico de los grupos del sidebar. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = ["Resumen", "Invitados", "Logística", "Operaciones"];

/**
 * Fuente única de navegación admin. El sidebar, la barra inferior móvil y la
 * hoja «Más» derivan TODAS de esta lista — nunca duplicar secciones a mano.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, grupo: "Resumen", enBottomNav: true, enMoreSheet: false },
  { href: "/invitados", label: "Invitados", icon: Users, grupo: "Invitados", enBottomNav: true, enMoreSheet: false },
  { href: "/grupos", label: "Grupos", icon: UsersRound, grupo: "Invitados", enBottomNav: false, enMoreSheet: true },
  { href: "/catering", label: "Catering", icon: ChefHat, grupo: "Invitados", enBottomNav: false, enMoreSheet: true },
  { href: "/canciones", label: "Canciones DJ", icon: Music4, grupo: "Invitados", enBottomNav: false, enMoreSheet: true },
  { href: "/mesas", label: "Mesas", icon: Table2, grupo: "Logística", enBottomNav: true, enMoreSheet: false },
  { href: "/mesas/plano", label: "Plano de mesas", icon: MapIcon, grupo: "Logística", enBottomNav: false, enMoreSheet: false },
  { href: "/autobuses", label: "Autobuses", icon: BusFront, grupo: "Logística", enBottomNav: false, enMoreSheet: true },
  { href: "/cronograma", label: "Cronograma", icon: CalendarClock, grupo: "Logística", enBottomNav: false, enMoreSheet: true },
  { href: "/proveedores", label: "Proveedores", icon: BriefcaseBusiness, grupo: "Operaciones", enBottomNav: false, enMoreSheet: true },
  { href: "/documentos", label: "Documentos", icon: FileText, grupo: "Operaciones", enBottomNav: false, enMoreSheet: true },
  { href: "/tareas", label: "Tareas", icon: ListChecks, grupo: "Operaciones", enBottomNav: true, enMoreSheet: false },
  { href: "/presupuesto", label: "Presupuesto", icon: WalletCards, grupo: "Operaciones", enBottomNav: false, enMoreSheet: true },
  { href: "/busqueda", label: "Buscar", icon: Search, grupo: "Operaciones", enBottomNav: false, enMoreSheet: true },
  { href: "/ajustes", label: "Ajustes", icon: Settings, grupo: "Operaciones", enBottomNav: false, enMoreSheet: true }
];

export const ADMIN_NAV_BOTTOM: AdminNavItem[] = ADMIN_NAV.filter((item) => item.enBottomNav);
export const ADMIN_NAV_MORE: AdminNavItem[] = ADMIN_NAV.filter((item) => item.enMoreSheet);

/**
 * Prefijos de primer nivel donde vive el panel admin (para decidir si el
 * bottom-nav se renderiza). Derivados de la lista para no perder secciones
 * nuevas (p. ej. `/canciones`, antes ausente).
 */
export const ADMIN_PREFIXES: string[] = Array.from(
  new Set(ADMIN_NAV.map((item) => `/${item.href.split("/")[1]}`))
);

/** Coincidencia genérica de ruta activa: exacta o bajo el mismo subárbol. */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
