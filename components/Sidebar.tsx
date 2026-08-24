"use client";

import { ArrowLeftRight, BarChart3, BookOpen, Building2, House, LogOut, PenLine, Tags, UserCog, Users } from "lucide-react";
import { Section } from "@/lib/types";

const items: { key: Section; label: string; icon: typeof House }[] = [
  { key: "home", label: "Tableau de bord", icon: House },
  { key: "catalogue", label: "Catalogue", icon: BookOpen },
  { key: "auteurs", label: "Auteurs", icon: PenLine },
  { key: "categories", label: "Catégories", icon: Tags },
  { key: "emprunts", label: "Emprunts", icon: ArrowLeftRight },
  { key: "adherents", label: "Membres", icon: Users },
];

export function Sidebar({ section, organisationName, canManageUsers, isPlatformAdmin, onNavigate, onLogout }: { section: Section; organisationName: string; canManageUsers: boolean; isPlatformAdmin: boolean; onNavigate: (section: Section) => void; onLogout: () => void }) {
  return <aside><div className="logo"><b>B</b><span>Bibliothèque<small>{organisationName || "Ressources partagées"}</small></span></div><nav>{items.map((item) => { const Icon = item.icon; return <button className={section === item.key ? "active" : ""} onClick={() => onNavigate(item.key)} key={item.key}><i><Icon size={22} strokeWidth={2} aria-hidden="true" /></i>{item.label}</button>; })}{canManageUsers && <button className={section === "utilisateurs" ? "active" : ""} onClick={() => onNavigate("utilisateurs")}><i><UserCog size={22} strokeWidth={2} aria-hidden="true" /></i>Utilisateurs</button>}{isPlatformAdmin && <button className={section === "administration" ? "active" : ""} onClick={() => onNavigate("administration")}><i><Building2 size={22} strokeWidth={2} aria-hidden="true" /></i>Administration</button>}<button disabled><i><BarChart3 size={22} strokeWidth={2} aria-hidden="true" /></i>Statistiques</button></nav><div className="aside-bottom"><span><em /> API connectée</span><button onClick={onLogout}><LogOut size={16} strokeWidth={2} aria-hidden="true" />Se déconnecter</button></div></aside>;
}
