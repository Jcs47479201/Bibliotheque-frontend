"use client";

import { useEffect, useState } from "react";
import { AuthorsPage } from "@/components/AuthorsPage";
import { CataloguePage } from "@/components/CataloguePage";
import { CategoriesPage } from "@/components/CategoriesPage";
import { Dashboard } from "@/components/Dashboard";
import { LoginForm } from "@/components/LoginForm";
import { MembersPage } from "@/components/MembersPage";
import { PlatformAdminPage } from "@/components/PlatformAdminPage";
import { Sidebar } from "@/components/Sidebar";
import { LoansPage } from "@/components/LoansPage";
import { UsersPage } from "@/components/UsersPage";
import { apiRequest } from "@/lib/api";
import { Data, Section, idOf, textOf } from "@/lib/types";

export default function Home() {
  const [logged, setLogged] = useState(false);
  const [section, setSection] = useState<Section>("home");
  const [organisation, setOrganisation] = useState<Data | null>(null);
  const [libraries, setLibraries] = useState<Data[]>([]);
  const [members, setMembers] = useState<Data[]>([]);
  const [authors, setAuthors] = useState<Data[]>([]);
  const [categories, setCategories] = useState<Data[]>([]);
  const [books, setBooks] = useState<Data[]>([]);
  const [loans, setLoans] = useState<Data[]>([]);
  const [users, setUsers] = useState<Data[]>([]);
  const [organisations, setOrganisations] = useState<Data[]>([]);
  const [platformLibraries, setPlatformLibraries] = useState<Data[]>([]);
  const [currentUser, setCurrentUser] = useState<Data | null>(null);
  const [selectedLibrary, setSelectedLibrary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const user = await apiRequest("/api/users/me/");
      setCurrentUser(user);
      if (user.platform_admin) {
        setOrganisations(await apiRequest("/api/organisation/admin/"));
        setPlatformLibraries(await apiRequest("/api/bibliotheque/admin/"));
        setSection("administration");
        return;
      }
      const [org, libs, authorsData, categoriesData, booksData, loansData] = await Promise.all([
        apiRequest("/api/organisation/me/"), apiRequest("/api/bibliotheque/me/"), apiRequest("/api/catalogue/auteurs/"),
        apiRequest("/api/catalogue/categories/"), apiRequest("/api/catalogue/livres/"), apiRequest("/api/circulation/emprunt/")
      ]);
      setOrganisation(org); setLibraries(libs); setAuthors(authorsData); setCategories(categoriesData); setBooks(booksData); setLoans(loansData);
      if (user.organisation_id && (user.platform_admin || user.role === "owner" || user.role === "admin")) setUsers(await apiRequest("/api/users/organisation/"));
      const libraryId = user.bibliotheque_id || selectedLibrary || idOf(libs[0] || {});
      setSelectedLibrary(libraryId);
      if (libraryId) setMembers(await apiRequest(`/api/bibliotheque/me/${libraryId}/adherents/`));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Erreur de chargement.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (localStorage.getItem("access")) window.setTimeout(() => { setLogged(true); void loadData(); }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logged && selectedLibrary) void apiRequest(`/api/bibliotheque/me/${selectedLibrary}/adherents/`).then(setMembers).catch(() => undefined);
  }, [logged, selectedLibrary]);

  if (!logged) return <LoginForm onLogin={() => { setLogged(true); void loadData(); }} />;

  async function mutate(path: string, method: string, data?: Data) {
    try { await apiRequest(path, { method, body: data ? JSON.stringify(data) : undefined }); await loadData(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : "Opération impossible."); throw exception; }
  }

  function logout() { localStorage.clear(); setLogged(false); }

  const canManageUsers = Boolean(currentUser?.organisation_id && !currentUser?.platform_admin && (currentUser?.role === "owner" || currentUser?.role === "admin"));
  return <main className="app"><Sidebar section={section} organisationName={textOf(organisation || {}, ["nom"])} canManageUsers={canManageUsers} isPlatformAdmin={Boolean(currentUser?.platform_admin)} onNavigate={setSection} onLogout={logout} /><div className="main"><header><div className="top-summary">{books.length} ouvrages <span>·</span> {members.length} membres</div><button className="theme-toggle" title="Changer de thème">☾</button></header>{error && <div className="alert">{error}<button onClick={() => setError("")}>×</button></div>}{loading && <div className="progress" />}<Content section={section} books={books} authors={authors} categories={categories} libraries={libraries} members={members} loans={loans} users={users} organisations={organisations} platformLibraries={platformLibraries} selectedLibrary={selectedLibrary} onLibraryChange={setSelectedLibrary} mutate={mutate} onNavigate={setSection} /></div></main>;
}

function Content({ section, books, authors, categories, libraries, members, loans, users, organisations, platformLibraries, selectedLibrary, onLibraryChange, mutate, onNavigate }: { section: Section; books: Data[]; authors: Data[]; categories: Data[]; libraries: Data[]; members: Data[]; loans: Data[]; users: Data[]; organisations: Data[]; platformLibraries: Data[]; selectedLibrary: string; onLibraryChange: (id: string) => void; mutate: (path: string, method: string, data?: Data) => Promise<void>; onNavigate: (section: Section) => void }) {
  if (section === "home") return <Dashboard books={books} members={members} loans={loans} categories={categories} onNavigate={onNavigate} />;
  if (section === "catalogue") return <CataloguePage books={books} authors={authors} categories={categories} libraries={libraries} mutate={mutate} />;
  if (section === "auteurs") return <AuthorsPage authors={authors} libraries={libraries} mutate={mutate} />;
  if (section === "categories") return <CategoriesPage categories={categories} libraries={libraries} mutate={mutate} />;
  if (section === "emprunts") return <LoansPage loans={loans} books={books} members={members} mutate={mutate} />;
  if (section === "utilisateurs") return <UsersPage users={users} libraries={libraries} mutate={mutate} />;
  if (section === "administration") return <PlatformAdminPage organisations={organisations} libraries={platformLibraries} mutate={mutate} />;
  return <MembersPage members={members} loans={loans} libraries={libraries} selectedLibrary={selectedLibrary} onLibraryChange={onLibraryChange} mutate={mutate} />;
}
