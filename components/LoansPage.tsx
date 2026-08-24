"use client";

import { FormEvent, useState } from "react";
import { Data, idOf, textOf } from "@/lib/types";
import { Modal } from "@/components/Modal";

interface LoansPageProps {
  loans: Data[];
  books: Data[];
  members: Data[];
  mutate: (path: string, method: string, data?: Data) => Promise<void>;
}

export function LoansPage({ loans, books, members, mutate }: LoansPageProps) {
  const [history, setHistory] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const filteredLoans = filterLoans(loans, history, query, status);

  return (
    <div className="resource-page">
      <ResourceHeading onCreate={() => setShowForm(true)} />
      {showForm && <Modal title="Ajouter un emprunt" onClose={() => setShowForm(false)}><LoanForm books={books} members={members} mutate={mutate} onClose={() => setShowForm(false)} /></Modal>}
      <LoanFilters history={history} status={status} query={query} onHistoryChange={setHistory} onStatusChange={setStatus} onQueryChange={setQuery} />
      <LoanTable loans={filteredLoans} books={books} members={members} onReturn={(loan) => mutate(`/api/circulation/emprunt/${idOf(loan)}/`, "PATCH", { date_retour: new Date().toISOString() })} />
    </div>
  );
}

function ResourceHeading({ onCreate }: { onCreate: () => void }) {
  return <div className="resource-heading"><div><h2>Emprunts</h2><p>Suivi des prêts en cours, des retards et de l’historique</p></div><div className="heading-actions"><button className="export-button">⇩ &nbsp; Export CSV</button><button className="orange-button" onClick={onCreate}>＋ &nbsp;Nouvel emprunt</button></div></div>;
}

function filterLoans(loans: Data[], history: boolean, query: string, status: string) {
  const today = new Date();
  return loans.filter((loan) => {
    const returned = Boolean(loan.date_retour);
    const overdue = !returned && Boolean(loan.date_limite) && new Date(String(loan.date_limite)) < today;
    const currentStatus = overdue ? "retard" : returned ? "retourne" : "actif";
    const searchableText = `${loan.livre_titre || loan.livre} ${loan.adherent_nom || loan.adherent}`.toLowerCase();
    return (history ? returned : !returned) && (!status || currentStatus === status) && searchableText.includes(query.toLowerCase());
  });
}

function LoanFilters({ history, status, query, onHistoryChange, onStatusChange, onQueryChange }: { history: boolean; status: string; query: string; onHistoryChange: (value: boolean) => void; onStatusChange: (value: string) => void; onQueryChange: (value: string) => void }) {
  return <section className="loan-filters"><div className="loan-tabs"><button className={!history ? "selected" : ""} onClick={() => onHistoryChange(false)}>Actifs</button><button className={history ? "selected" : ""} onClick={() => onHistoryChange(true)}>Historique</button></div><input placeholder="Rechercher un membre ou un livre…" value={query} onChange={(event) => onQueryChange(event.target.value)} /><select value={status} onChange={(event) => onStatusChange(event.target.value)}><option value="">Tous les statuts</option><option value="actif">En cours</option><option value="retard">En retard</option><option value="retourne">Retourné</option></select></section>;
}

function LoanTable({ loans, books, members, onReturn }: { loans: Data[]; books: Data[]; members: Data[]; onReturn: (loan: Data) => void }) {
  const today = new Date();
  const formatDate = (value: unknown) => value ? new Date(String(value)).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "-";
  const display = (value: unknown, items: Data[], fields: string[]) => { const item = items.find((entry) => idOf(entry) === String(value)); return item ? textOf(item, fields) : String(value || "-").slice(0, 12); };
  if (!loans.length) return <section className="resource-table"><p className="dashboard-empty">Aucun emprunt dans cette vue.</p></section>;
  return <section className="resource-table loan-table"><table><thead><tr><th>Membre</th><th>Livre</th><th>Emprunt</th><th>Retour prévu</th><th>Statut</th><th>Action</th></tr></thead><tbody>{loans.map((loan) => { const overdue = !loan.date_retour && loan.date_limite && new Date(String(loan.date_limite)) < today; const memberName = String(loan.adherent_nom || display(loan.adherent, members, ["prenom", "nom"])); const bookTitle = String(loan.livre_titre || display(loan.livre, books, ["titre"])); return <tr key={idOf(loan)}><td><strong>{memberName}</strong></td><td>{bookTitle}</td><td>{formatDate(loan.date_emprunt)}</td><td>{formatDate(loan.date_limite)}</td><td><span className={`status-pill ${overdue ? "retard" : loan.date_retour ? "retourne" : "actif"}`}>{overdue ? "En retard" : loan.date_retour ? "Retourné" : "En cours"}</span></td><td>{!loan.date_retour ? <button className="return-button" onClick={() => onReturn(loan)}>↶ &nbsp; Retour</button> : <span className="returned-mark">✓</span>}</td></tr>; })}</tbody></table></section>;
}

export function LoanForm({ books, members, mutate, onClose }: { books: Data[]; members: Data[]; mutate: LoansPageProps["mutate"]; onClose: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await mutate("/api/circulation/emprunt/create/", "POST", Object.fromEntries(new FormData(event.currentTarget))); onClose(); }
  return <form className="modal-form" onSubmit={submit}><label>Livre<select name="livre">{books.map((book) => <option key={idOf(book)} value={idOf(book)}>{textOf(book, ["titre"])}</option>)}</select></label><label>Adhérent<select name="adherent">{members.map((member) => <option key={idOf(member)} value={idOf(member)}>{textOf(member, ["prenom", "nom"])}</option>)}</select></label><label>Date limite<input name="date_limite" type="date" required /></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Annuler</button><button className="modal-submit" type="submit">Enregistrer</button></div></form>;
}
