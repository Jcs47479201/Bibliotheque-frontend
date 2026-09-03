"use client";

import { ArrowRight, BookOpen, Building2, ClipboardList, RotateCcw, Share2 } from "lucide-react";
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
  const totalBooks = books.length || 1;

  return (
    <div className="dashboard-body">
      <DashboardIntro />
      <MetricsGrid metrics={metrics} booksCount={books.length} onNavigate={onNavigate} />
      <div className="dashboard-grid dashboard-grid-top">
        <ResourceTrend booksCount={books.length} />
        <PopularCategories categories={categoryCounts} totalBooks={totalBooks} />
        <QuickActions onNavigate={onNavigate} />
      </div>
      <div className="dashboard-grid dashboard-grid-bottom">
        <LoanActivity loans={loans} />
        <PartnerLibraries members={members} />
        <RecentActivity loans={metrics.recentLoans} books={books} members={members} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function DashboardIntro() {
  return (
    <div className="dashboard-intro">
      <h2>Bonjour, Alexis !</h2>
      <p>Voici un aperçu de votre réseau de bibliothèques et des activités.</p>
    </div>
  );
}

function MetricsGrid({ metrics, booksCount, onNavigate }: { metrics: DashboardMetrics; booksCount: number; onNavigate: (section: Section) => void }) {
  const cards = [
    { label: "Ressources totales", value: booksCount, detail: "+12 ce mois", icon: BookOpen, className: "book-icon", section: "catalogue" as Section },
    { label: "Bibliothèques connectées", value: 18, detail: "+2 ce mois", icon: Building2, className: "library-icon", section: "adherents" as Section },
    { label: "Ressources partagées", value: Math.max(0, Math.round(booksCount * .14)), detail: "+28 ce mois", icon: Share2, className: "share-icon", section: "catalogue" as Section },
    { label: "Emprunts en cours", value: metrics.activeLoans.length, detail: "+8 ce mois", icon: RotateCcw, className: "loan-icon", section: "emprunts" as Section },
  ];

  return <div className="maquette-stats">{cards.map((card) => { const Icon = card.icon; return <button className="metric-card" onClick={() => onNavigate(card.section)} key={card.label}><span>{card.label}</span><strong>{card.value.toLocaleString("fr-FR")}</strong><small>{card.detail}</small><b className={`metric-icon ${card.className}`}><Icon size={24} /></b></button>; })}</div>;
}

function ResourceTrend({ booksCount }: { booksCount: number }) {
  const values = [Math.max(0, booksCount - 850), Math.max(0, booksCount - 650), Math.max(0, booksCount - 490), Math.max(0, booksCount - 290), Math.max(0, booksCount - 130), booksCount];
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${index * 20},${100 - (value / max) * 70}`).join(" ");
  return <section className="maquette-panel trend-panel"><div className="panel-title-row"><h3>Évolution des ressources</h3><select defaultValue="6"><option value="6">6 derniers mois</option></select></div><div className="chart"><svg viewBox="0 0 100 110" preserveAspectRatio="none" aria-label="Évolution des ressources"><path d={`M ${points} L 100 110 L 0 110 Z`} className="chart-area" /><polyline points={points} className="chart-line" />{values.map((value, index) => <circle key={value + index} cx={index * 20} cy={100 - (value / max) * 70} r="1.4" className="chart-point" />)}</svg><div className="chart-labels"><span>Mars</span><span>Avr.</span><span>Mai</span><span>Juin</span><span>Juil.</span><span>Août</span></div></div></section>;
}

function LoanActivity({ loans }: { loans: Data[] }) {
  const total = Math.max(loans.length, 1);
  return <section className="maquette-panel loan-activity"><div className="panel-title-row"><h3>Activité des emprunts</h3><select defaultValue="week"><option value="week">Cette semaine</option></select></div><div className="bars">{[.78, .48, .66, .55, .6, .42, .3].map((height, index) => <div className="bar-day" key={index}><div className="bar-pair"><i style={{ height: `${Math.max(12, height * 100)}%` }} /><b style={{ height: `${Math.max(8, height * 76)}%` }} /></div><small>{["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."][index]}</small></div>)}</div><div className="chart-key"><span><i />Emprunts</span><span><i />Retours</span><small>{total} activité(s) enregistrée(s)</small></div></section>;
}

function PartnerLibraries({ members }: { members: Data[] }) {
  const names = ["Bibliothèque Universitaire Félix Houphouët", "Médiathèque de Cocody", "Bibliothèque Municipale de Yopougon", "Centre Culturel d'Adjamé", "Bibliothèque de Bouaké"];
  return <section className="maquette-panel partners-panel"><div className="panel-title-row"><h3>Top bibliothèques partenaires</h3><select defaultValue="shared"><option value="shared">Par ressources partagées</option></select></div>{names.map((name, index) => <div className="partner-row" key={name}><b>{index + 1}</b><span>{name}</span><strong>{Math.max(18, members.length * (5 - index))}</strong></div>)}</section>;
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

function QuickActions({ onNavigate }: { onNavigate: (section: Section) => void }) {
  const actions = [{ label: "Ajouter une ressource", icon: BookOpen, section: "catalogue" as Section }, { label: "Partager une ressource", icon: Share2, section: "catalogue" as Section }, { label: "Ajouter une bibliothèque", icon: Building2, section: "adherents" as Section }, { label: "Voir les demandes", icon: ClipboardList, section: "emprunts" as Section }];
  return <section className="maquette-panel quick-panel"><h3>Actions rapides</h3>{actions.map(({ label, icon: Icon, section }) => <button key={label} onClick={() => onNavigate(section)}><Icon size={18} />{label}<ArrowRight size={14} /></button>)}</section>;
}

function PopularCategories({ categories, totalBooks }: { categories: CategoryCount[]; totalBooks: number }) {
  const colors = ["#0e6b4b", "#1795a5", "#f7b32b", "#7a55b8", "#eb8b16"];
  const circumference = 2 * Math.PI * 38;
  return <section className="maquette-panel categories-panel"><div className="panel-title-row"><h3>Ressources par catégorie</h3><button className="text-button">Voir tout</button></div><div className="donut-layout"><div className="donut"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" className="donut-track" />{categories.map((category, index) => { const length = (category.count / totalBooks) * circumference; const offset = categories.slice(0, index).reduce((sum, item) => sum + (item.count / totalBooks) * circumference, 0); return <circle key={category.name} cx="50" cy="50" r="38" className="donut-segment" stroke={colors[index]} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />; })}</svg><strong>{totalBooks.toLocaleString("fr-FR")}</strong><small>Total</small></div><div className="category-legend">{categories.length ? categories.map((category, index) => <div key={category.name}><i style={{ background: colors[index] }} /><span>{category.name}</span><b>{Math.round(category.count / totalBooks * 100)}%</b></div>) : <p className="dashboard-empty">Aucune catégorie disponible.</p>}</div></div></section>;
}
