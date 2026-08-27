"use client";

import { FormEvent, useState } from "react";
import { Data, idOf, textOf } from "@/lib/types";
import { Modal } from "@/components/Modal";

interface CatalogueProps { books: Data[]; authors: Data[]; categories: Data[]; libraries: Data[]; mutate: (path: string, method: string, data?: Data) => Promise<void>; }

export function CataloguePage({ books, authors, categories, libraries, mutate }: CatalogueProps) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const filteredBooks = books.filter((book) => {
    const matchesSearch = `${book.titre} ${book.isbn}`.toLowerCase().includes(query.toLowerCase());
    return matchesSearch && (!genre || relationId(book.categorie) === genre) && (!status || String(book.statut) === status);
  });

  return <div className="resource-page"><ResourceHeading title="Catalogue" description="Gérez les ouvrages et ressources de la bibliothèque" action="Nouveau livre" onAction={() => setShowForm(true)} />{showForm && <Modal title="Ajouter un livre" onClose={() => setShowForm(false)}><BookForm authors={authors} categories={categories} libraries={libraries} mutate={mutate} onClose={() => setShowForm(false)} /></Modal>}<section className="filters"><input placeholder="Rechercher titre, auteur, ISBN…" value={query} onChange={(event) => setQuery(event.target.value)} /><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="">Tous les genres</option>{categories.map((category) => <option key={idOf(category)} value={idOf(category)}>{textOf(category, ["nom"])}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous les statuts</option><option value="disponible">Disponible</option><option value="emprunte">Emprunté</option><option value="reserve">Réservé</option></select><select defaultValue=""><option value="">Toutes les années</option></select></section><section className="resource-table"><table><thead><tr><th>Titre</th><th>Auteur</th><th>Genre</th><th>Année</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{filteredBooks.map((book) => <BookRow key={idOf(book)} book={book} authors={authors} categories={categories} />)}</tbody></table>{!filteredBooks.length && <p className="dashboard-empty">Aucun ouvrage ne correspond à ces filtres.</p>}</section></div>;
}

function ResourceHeading({ title, description, action, onAction }: { title: string; description: string; action: string; onAction: () => void }) { return <div className="resource-heading"><div><h2>{title}</h2><p>{description}</p></div><div className="heading-actions"><button className="export-button">⇩ &nbsp; Export CSV</button><button className="orange-button" onClick={onAction}>＋ &nbsp;{action}</button></div></div>; }

function BookRow({ book, authors, categories }: { book: Data; authors: Data[]; categories: Data[] }) { const category = categories.find((item) => idOf(item) === relationId(book.categorie)); const authorNames = relationValues(book.auteurs).map((value) => authors.find((author) => idOf(author) === value)?.nom || "Auteur inconnu").join(", "); const status = String(book.statut || "disponible"); return <tr><td><strong>{textOf(book, ["titre"])}</strong><small>{textOf(book, ["isbn"])}</small></td><td>{authorNames || "-"}</td><td>{textOf(category || {}, ["nom"]) || "-"}</td><td>{String(book.date_creation || "").slice(0, 4) || "-"}</td><td><span className={`status-pill ${status}`}>{status === "disponible" ? "Disponible" : status === "emprunte" ? "Emprunté" : status}</span></td><td><div className="row-actions"><button title="Voir">◉</button><button title="Modifier">⌕</button></div></td></tr>; }

function relationId(value: unknown): string { return value && typeof value === "object" ? idOf(value as Data) : String(value || ""); }
function relationValues(value: unknown): string[] { return Array.isArray(value) ? value.map(relationId).filter(Boolean) : []; }

function BookForm({ authors, categories, libraries, mutate, onClose }: { authors: Data[]; categories: Data[]; libraries: Data[]; mutate: CatalogueProps["mutate"]; onClose: () => void }) {
  const [form, setForm] = useState({
    titre: "",
    isbn: "",
    pages: "",
    langue: "fr",
    statut: "disponible",
    bibliotheque: idOf(libraries[0] || {}),
    categorie: idOf(categories[0] || {}),
    auteurs: [] as string[],
  });
  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const availableCategories = categories.filter(
    (c) => !form.bibliotheque || !c.bibliotheque || String(c.bibliotheque) === form.bibliotheque
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await mutate("/api/catalogue/livres/create/", "POST", { ...form, pages: Number(form.pages) });
    onClose();
  };

  return (
    <form className="modal-form" onSubmit={submit}>
      <div className="grid">
        {(["titre", "isbn", "pages", "langue"] as const).map((key) => (
          <label key={key}>
            {key}
            <input value={form[key]} onChange={(event) => update(key, event.target.value)} required />
          </label>
        ))}
        {libraries.length > 1 && (
          <label>
            Bibliothèque
            <select
              value={form.bibliotheque}
              onChange={(event) => {
                const libId = event.target.value;
                const nextCats = categories.filter((c) => !libId || !c.bibliotheque || String(c.bibliotheque) === libId);
                setForm((prev) => ({ ...prev, bibliotheque: libId, categorie: idOf(nextCats[0] || {}) }));
              }}
              required
            >
              {libraries.map((item) => (
                <option key={idOf(item)} value={idOf(item)}>
                  {textOf(item, ["nom"])}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Catégorie
          <select value={form.categorie} onChange={(event) => update("categorie", event.target.value)} required>
            {availableCategories.map((item) => (
              <option key={idOf(item)} value={idOf(item)}>
                {textOf(item, ["nom"])}
              </option>
            ))}
          </select>
        </label>
        <label>
          Statut
          <select value={form.statut} onChange={(event) => update("statut", event.target.value)}>
            <option value="disponible">Disponible</option>
            <option value="emprunte">Emprunté</option>
            <option value="endommage">Endommagé</option>
            <option value="non_disponible">Non disponible</option>
          </select>
        </label>
      </div>
      <label>
        Auteurs (sélection multiple)
        <select
          className="authors-select"
          multiple
          size={Math.min(5, Math.max(3, authors.length))}
          value={form.auteurs}
          onChange={(event) => setForm({ ...form, auteurs: Array.from(event.target.selectedOptions, (option) => option.value) })}
        >
          {authors.map((item) => (
            <option key={idOf(item)} value={idOf(item)}>
              {textOf(item, ["nom"])}
            </option>
          ))}
        </select>
      </label>
      <div className="modal-actions">
        <button type="button" className="cancel-button" onClick={onClose}>Annuler</button>
        <button className="modal-submit" type="submit">Ajouter</button>
      </div>
    </form>
  );
}
