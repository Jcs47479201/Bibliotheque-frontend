"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/Modal";
import { Data, idOf, textOf } from "@/lib/types";

type Mutate = (path: string, method: string, data?: Data) => Promise<void>;

export function AuthorsPage({ authors, libraries, mutate }: { authors: Data[]; libraries: Data[]; mutate: Mutate }) {
  const [query, setQuery] = useState("");
  const [editingAuthor, setEditingAuthor] = useState<Data | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const visibleAuthors = authors.filter((author) => textOf(author, ["nom"]).toLowerCase().includes(query.toLowerCase()));
  const closeModal = () => { setEditingAuthor(null); setIsCreating(false); };

  return <div className="resource-page"><div className="resource-heading"><div><h2>Auteurs</h2><p>Les auteurs de votre catalogue</p></div><div className="heading-actions"><button className="export-button">⇩ &nbsp; Export CSV</button><button className="orange-button" onClick={() => setIsCreating(true)}>＋ &nbsp;Nouvel auteur</button></div></div><section className="filters author-filters"><input placeholder="Rechercher un auteur…" value={query} onChange={(event) => setQuery(event.target.value)} /></section><section className="resource-table"><table><thead><tr><th>Nom</th><th>Bibliothèque</th><th>Créé le</th><th>Actions</th></tr></thead><tbody>{visibleAuthors.map((author) => { const library = libraries.find((item) => idOf(item) === String(author.bibliotheque)); return <tr key={idOf(author)}><td><strong>{textOf(author, ["nom"])}</strong></td><td>{textOf(library || {}, ["nom"]) || "Bibliothèque"}</td><td>{String(author.date_creation || "-").slice(0, 10)}</td><td><div className="row-actions"><button title="Modifier" aria-label="Modifier" onClick={() => setEditingAuthor(author)}>✎</button><button className="delete icon-delete" title="Supprimer" aria-label="Supprimer" onClick={() => mutate(`/api/catalogue/auteurs/${idOf(author)}/`, "DELETE")}>⊘</button></div></td></tr>; })}</tbody></table>{!visibleAuthors.length && <p className="dashboard-empty">Aucun auteur à afficher.</p>}</section>{(isCreating || editingAuthor) && <Modal title={editingAuthor ? "Modifier l’auteur" : "Ajouter un auteur"} onClose={closeModal}><AuthorForm author={editingAuthor} libraries={libraries} mutate={mutate} onClose={closeModal} /></Modal>}</div>;
}

function AuthorForm({ author, libraries, mutate, onClose }: { author: Data | null; libraries: Data[]; mutate: Mutate; onClose: () => void }) {
  const [authorName, setAuthorName] = useState(textOf(author || {}, ["nom"]));
  const [library, setLibrary] = useState(String(author?.bibliotheque || idOf(libraries[0] || "")));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload: Record<string, string> = { nom: authorName };
      if (library) {
        payload.bibliotheque = library;
      }
      await mutate(author ? `/api/catalogue/auteurs/${idOf(author)}/` : "/api/catalogue/auteurs/create/", author ? "PATCH" : "POST", payload);
      onClose();
    } catch {
      return;
    }
  }
  return (
    <form className="modal-form" onSubmit={submit}>
      <label htmlFor="author-name">
        Nom
        <input id="author-name" value={authorName} onChange={(event) => setAuthorName(event.target.value)} required placeholder="Nom de l’auteur" />
      </label>
      {libraries.length > 0 && (
        <label htmlFor="author-library">
          Bibliothèque
          <select id="author-library" value={library} onChange={(event) => setLibrary(event.target.value)} required>
            {libraries.map((item) => (
              <option key={idOf(item)} value={idOf(item)}>
                {textOf(item, ["nom"])}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="modal-actions">
        <button type="button" className="cancel-button" onClick={onClose}>Annuler</button>
        <button type="submit" className="modal-submit">{author ? "Enregistrer" : "Ajouter"}</button>
      </div>
    </form>
  );
}
