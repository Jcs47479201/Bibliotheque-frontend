"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const tokens = await apiRequest("/api/token/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("access", tokens.access);
      localStorage.setItem("refresh", tokens.refresh);
      onLogin();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Connexion refusée.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-brand-panel" aria-label="Présentation de Biblio">
        <div className="login-brand-top"><span className="login-mark">B</span><span className="login-brand-name">Bibliothèque<small>Ressources chrétiennes</small></span></div>
        <div className="login-brand-content"><span className="login-overline">VOTRE ESPACE DE LECTURE</span><h1>La connaissance<br /><em>bien gardée.</em></h1><p>Organisez vos collections, accompagnez vos lecteurs et suivez chaque ouvrage avec simplicité.</p></div>
        <div className="login-brand-footer"><span>01</span><span className="login-line" /><span>CATALOGUE · PRÊTS · COMMUNAUTÉ</span></div>
      </section>
      <section className="login-form-panel"><div className="login-form-wrap"><span className="login-form-kicker">ESPACE DE TRAVAIL</span><h2>Content de vous revoir.</h2><p className="login-description">Connectez-vous pour retrouver votre bibliothèque.</p><form onSubmit={handleSubmit}><label htmlFor="username">Identifiant<input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" placeholder="Votre identifiant" /></label><label htmlFor="password">Mot de passe<input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="Votre mot de passe" /></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Connexion en cours…" : "Ouvrir la session"}<span>→</span></button></form><div className="login-meta"><span className="secure-dot" />Connexion sécurisée par JWT</div></div></section>
    </main>
  );
}
