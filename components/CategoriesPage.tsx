"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/Modal";
import { Data, idOf, textOf } from "@/lib/types";

type Mutate = (path: string, method: string, data?: Data) => Promise<void>;

export function CategoriesPage({ categories, libraries, mutate }: { categories: Data[]; libraries: Data[]; mutate: Mutate }) {
  const [query, setQuery] = useState("");
  const [editingCategory, setEditingCategory] = useState<Data | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const visibleCategories = categories.filter((category) => textOf(category, ["nom"]).toLowerCase().includes(query.toLowerCase()));

  function closeModal() { setEditingCategory(null); setIsCreating(false); }

  return <div className="resource-page"><div className="resource-heading"><div><h2>Catégories</h2><p>Organisez les genres de votre catalogue</p></div><div className="heading-actions"><button className="export-button">⇩ &nbsp; Export CSV</button><button className="orange-button" onClick={() => setIsCreating(true)}>＋ &nbsp;Nouvelle catégorie</button></div></div><section className="filters author-filters"><input placeholder="Rechercher une catégorie…" value={query} onChange={(event) => setQuery(event.target.value)} /></section><section className="resource-table"><table><thead><tr><th>Nom</th><th>Bibliothèque</th><th>Actions</th></tr></thead><tbody>{visibleCategories.map((category) => { const library = libraries.find((item) => idOf(item) === String(category.bibliotheque)); return <tr key={idOf(category)}><td><strong>{textOf(category, ["nom"])}</strong></td><td>{textOf(library || {}, ["nom"]) || "Bibliothèque inconnue"}</td><td><div className="row-actions"><button title="Modifier" aria-label="Modifier" onClick={() => setEditingCategory(category)}>✎</button><button className="delete icon-delete" title="Supprimer" aria-label="Supprimer" onClick={() => mutate(`/api/catalogue/categories/${idOf(category)}/`, "DELETE")}>⊘</button></div></td></tr>; })}</tbody></table>{!visibleCategories.length && <p className="dashboard-empty">Aucune catégorie à afficher.</p>}</section>{(isCreating || editingCategory) && <Modal title={editingCategory ? "Modifier la catégorie" : "Ajouter une catégorie"} onClose={closeModal}><CategoryForm category={editingCategory} libraries={libraries} mutate={mutate} onClose={closeModal} /></Modal>}</div>;
}

function CategoryForm({ category, libraries, mutate, onClose }: { category: Data | null; libraries: Data[]; mutate: Mutate; onClose: () => void }) {
  const [name, setName] = useState(textOf(category || {}, ["nom"]));
  const [library, setLibrary] = useState(String(category?.bibliotheque || idOf(libraries[0] || {})));
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const payload = { nom: name, bibliotheque: library }; await mutate(category ? `/api/catalogue/categories/${idOf(category)}/` : "/api/catalogue/categories/create/", category ? "PATCH" : "POST", payload); onClose(); }
  return <form className="modal-form" onSubmit={submit}><label htmlFor="category-name">Nom<input id="category-name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Nom de la catégorie" /></label><label htmlFor="category-library">Bibliothèque<select id="category-library" value={library} onChange={(event) => setLibrary(event.target.value)} required>{libraries.map((item) => <option key={idOf(item)} value={idOf(item)}>{textOf(item, ["nom"])}</option>)}</select></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Annuler</button><button type="submit" className="modal-submit">{category ? "Enregistrer" : "Ajouter"}</button></div></form>;
}
