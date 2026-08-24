"use client";

import { Data, Section, idOf, textOf } from "@/lib/types";

interface DashboardProps {
  books: Data[];
  members: Data[];
  loans: Data[];
  categories: Data[];
  onNavigate: (section: Section) => void;
}

interface DashboardMetrics {
  availableBooks: number;
  activeLoans: Data[];
  overdueLoans: Data[];
  recentLoans: Data[];
}

interface CategoryCount {
  name: string;
  count: number;
}

/** Centralise les indicateurs afin que le JSX reste dédié à la présentation. */
function getDashboardMetrics(books: Data[], loans: Data[]): DashboardMetrics {
  const today = new Date();
  const activeLoans = loans.filter((loan) => !loan.date_retour);
  const overdueLoans = activeLoans.filter(
    (loan) => loan.date_limite && new Date(String(loan.date_limite)) < today,
  );
  const recentLoans = [...loans]
    .sort((left, right) => String(right.date_emprunt).localeCompare(String(left.date_emprunt)))
    .slice(0, 4);

  return {
    availableBooks: books.filter((book) => String(book.statut || "disponible") === "disponible").length,
    activeLoans,
    overdueLoans,
    recentLoans,
  };
}

/** Calcule les catégories les plus représentées dans le catalogue. */
function getCategoryCounts(books: Data[], categories: Data[]): CategoryCount[] {
  return categories
    .map((category) => ({
      name: textOf(category, ["nom"]) || "Sans catégorie",
      count: books.filter((book) => relationId(book.categorie) === idOf(category)).length,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 4);
}

function formatDate(value: unknown): string {
  if (!value) return "Date inconnue";
  return new Date(String(value)).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Dashboard({ books, members, loans, categories, onNavigate }: DashboardProps) {
  const metrics = getDashboardMetrics(books, loans);
  const categoryCounts = getCategoryCounts(books, categories);

  return (
    <div className="dashboard-body">
      <DashboardIntro />
      <MetricsGrid metrics={metrics} membersCount={members.length} booksCount={books.length} onNavigate={onNavigate} />
      <div className="dashboard-panels">
        <RecentActivity loans={metrics.recentLoans} books={books} members={members} onNavigate={onNavigate} />
        <PopularCategories categories={categoryCounts} />
      </div>
    </div>
  );
}

function DashboardIntro() {
  return (
    <div className="dashboard-intro">
      <h2>Tableau de bord</h2>
      <p>Vue d’ensemble de la bibliothèque et des ressources partagées</p>
    </div>
  );
}

function MetricsGrid({ metrics, membersCount, booksCount, onNavigate }: { metrics: DashboardMetrics; membersCount: number; booksCount: number; onNavigate: (section: Section) => void }) {
  const cards = [
    { label: "Livres disponibles", value: metrics.availableBooks, detail: `sur ${booksCount} titres au catalogue`, icon: "▣", className: "book-icon", section: "catalogue" as Section },
    { label: "Emprunts en cours", value: metrics.activeLoans.length, detail: `${metrics.overdueLoans.length} retour(s) dans moins de 3 jours`, icon: "◷", className: "clock-icon", section: "emprunts" as Section },
    { label: "Retards", value: metrics.overdueLoans.length, detail: "à relancer auprès des membres", icon: "!", className: "alert-icon", section: "emprunts" as Section },
    { label: "Nouveaux membres", value: membersCount, detail: "inscrits dans la bibliothèque", icon: "♙", className: "member-icon", section: "adherents" as Section },
  ];

  return <div className="maquette-stats">{cards.map((card) => <button className="metric-card" onClick={() => onNavigate(card.section)} key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.detail}</small><b className={`metric-icon ${card.className}`}>{card.icon}</b></button>)}</div>;
}

function RecentActivity({ loans, books, members, onNavigate }: { loans: Data[]; books: Data[]; members: Data[]; onNavigate: (section: Section) => void }) {
  return <section className="maquette-panel recent-panel"><div className="panel-title-row"><div><span className="panel-kicker">Mouvements</span><h3>Activité récente</h3></div><button className="text-button" onClick={() => onNavigate("emprunts")}>Voir tout →</button></div>{loans.length ? loans.map((loan) => <RecentLoan key={idOf(loan)} loan={loan} books={books} members={members} />) : <p className="dashboard-empty">Aucun emprunt récent.</p>}</section>;
}

function RecentLoan({ loan, books, members }: { loan: Data; books: Data[]; members: Data[] }) {
  const book = findRelatedItem(loan.livre, books);
  const member = findRelatedItem(loan.adherent, members);
  const bookTitle = String(loan.livre_titre || textOf(book, ["titre"]) || "Livre inconnu");
  const memberName = String(loan.adherent_nom || textOf(member, ["prenom", "nom"]) || "Adhérent inconnu");

  return <div className="recent-row"><div><strong>{bookTitle}</strong><small>{memberName} · emprunté le {formatDate(loan.date_emprunt)}</small></div><span>{loan.date_retour ? "Retourné" : "En cours"}</span></div>;
}

function findRelatedItem(value: unknown, items: Data[]): Data {
  if (value && typeof value === "object") return value as Data;
  return items.find((item) => idOf(item) === String(value)) || {};
}

function relationId(value: unknown): string {
  return value && typeof value === "object" ? idOf(value as Data) : String(value || "");
}

function PopularCategories({ categories }: { categories: CategoryCount[] }) {
  return <section className="maquette-panel genres-panel"><span className="panel-kicker">Répartition</span><h3>Genres les plus présents</h3>{categories.length ? categories.map((category) => <div className="genre-row" key={category.name}><div><span>{category.name}</span><b>{category.count}</b></div><i><em style={{ width: `${category.count ? Math.max(20, category.count * 22) : 0}%` }} /></i></div>) : <p className="dashboard-empty">Aucune catégorie disponible.</p>}</section>;
}
