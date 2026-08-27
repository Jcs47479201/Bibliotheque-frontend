"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/Modal";
import { Data, idOf } from "@/lib/types";

interface UsersPageProps {
  users: Data[];
  libraries: Data[];
  mutate: (path: string, method: string, data?: Data) => Promise<void>;
}

export function UsersPage({ users, libraries, mutate }: UsersPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const visibleUsers = users.filter((user) => `${user.username} ${user.email} ${user.bibliotheque_nom || ""}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="resource-page">
      <div className="resource-heading">
        <div>
          <h2>Utilisateurs</h2>
          <p>Gérez les accès et les affectations par bibliothèque</p>
        </div>
        <button className="orange-button" onClick={() => setShowForm(true)}>＋ Nouvel utilisateur</button>
      </div>
      <section className="filters">
        <input placeholder="Rechercher un identifiant, un email ou une bibliothèque…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </section>
      <section className="resource-table">
        <table>
          <thead>
            <tr>
              <th>Identifiant</th>
              <th>Email</th>
              <th>Bibliothèque assignée</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={idOf(user)}>
                <td><strong>{String(user.username)}</strong></td>
                <td>{String(user.email || "-")}</td>
                <td>
                  <select
                    value={String(user.bibliotheque_id || "")}
                    disabled={user.role === "owner"}
                    onChange={(event) => mutate(`/api/users/organisation/${idOf(user)}/`, "PATCH", { bibliotheque: event.target.value || null })}
                  >
                    <option value="">Toutes les bibliothèques</option>
                    {libraries.map((lib) => (
                      <option key={idOf(lib)} value={idOf(lib)}>
                        {String(lib.nom)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={String(user.role || "bibliothecaire")}
                    disabled={user.role === "owner"}
                    onChange={(event) => mutate(`/api/users/organisation/${idOf(user)}/`, "PATCH", { role: event.target.value })}
                  >
                    <option value="owner">Propriétaire</option>
                    <option value="admin">Administrateur</option>
                    <option value="bibliothecaire">Bibliothécaire</option>
                  </select>
                </td>
                <td>
                  {user.role !== "owner" && (
                    <button className="delete" onClick={() => mutate(`/api/users/organisation/${idOf(user)}/`, "DELETE")}>
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleUsers.length && <p className="dashboard-empty">Aucun utilisateur à afficher.</p>}
      </section>
      {showForm && (
        <Modal title="Ajouter un utilisateur" onClose={() => setShowForm(false)}>
          <UserForm libraries={libraries} mutate={mutate} onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}

function UserForm({ libraries, mutate, onClose }: { libraries: Data[]; mutate: UsersPageProps["mutate"]; onClose: () => void }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "bibliothecaire", bibliotheque: libraries[0] ? idOf(libraries[0]) : "" });
  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: Record<string, string> = {
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role,
    };
    if (form.bibliotheque) {
      payload.bibliotheque = form.bibliotheque;
    }
    await mutate("/api/users/organisation/", "POST", payload);
    onClose();
  }
  return (
    <form className="modal-form" onSubmit={submit}>
      <div className="grid">
        <label>
          Identifiant
          <input value={form.username} onChange={(event) => update("username", event.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required minLength={8} />
        </label>
        <label>
          Rôle
          <select value={form.role} onChange={(event) => update("role", event.target.value)}>
            <option value="bibliothecaire">Bibliothécaire</option>
            <option value="admin">Administrateur</option>
          </select>
        </label>
        {libraries.length > 0 && (
          <label>
            Bibliothèque assignée
            <select value={form.bibliotheque} onChange={(event) => update("bibliotheque", event.target.value)}>
              <option value="">Toutes (Accès organisation globale)</option>
              {libraries.map((lib) => (
                <option key={idOf(lib)} value={idOf(lib)}>
                  {String(lib.nom)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="modal-actions">
        <button type="button" className="cancel-button" onClick={onClose}>Annuler</button>
        <button className="modal-submit" type="submit">Ajouter</button>
      </div>
    </form>
  );
}
