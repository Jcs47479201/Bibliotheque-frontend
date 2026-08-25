"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organisationNom, setOrganisationNom] = useState("");
  const [organisationEmail, setOrganisationEmail] = useState("");
  const [organisationTelephone, setOrganisationTelephone] = useState("");
  const [bibliothequeNom, setBibliothequeNom] = useState("");
  const [bibliothequeAdresse, setBibliothequeAdresse] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await apiRequest("/api/auth/register/", {
          method: "POST",
          body: JSON.stringify({
            username,
            email,
            password,
            organisation_nom: organisationNom,
            organisation_email: organisationEmail,
            organisation_telephone: organisationTelephone,
            bibliotheque_nom: bibliothequeNom,
            bibliotheque_adresse: bibliothequeAdresse,
          }),
        });
      }

      const tokens = await apiRequest("/api/token/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("access", tokens.access);
      localStorage.setItem("refresh", tokens.refresh);
      onLogin();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Opération refusée.");
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
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <span className="login-form-kicker">ESPACE DE TRAVAIL</span>
          <h2>{isRegistering ? "Créer votre espace." : "Content de vous revoir."}</h2>
          <p className="login-description">
            {isRegistering ? "Initialisez votre compte, organisation et bibliothèque." : "Connectez-vous pour retrouver votre bibliothèque."}
          </p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Identifiant<input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" placeholder="Votre identifiant" /></label>
            {isRegistering && <label htmlFor="email">Email<input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="Votre email" /></label>}
            <label htmlFor="password">Mot de passe<input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={isRegistering ? 8 : undefined} autoComplete={isRegistering ? "new-password" : "current-password"} placeholder={isRegistering ? "8 caractères minimum" : "Votre mot de passe"} /></label>
            {isRegistering && <>
              <label htmlFor="organisationNom">Nom de votre organisation<input id="organisationNom" value={organisationNom} onChange={(event) => setOrganisationNom(event.target.value)} required placeholder="Mon organisation" /></label>
              <label htmlFor="organisationEmail">Email de votre organisation<input id="organisationEmail" type="email" value={organisationEmail} onChange={(event) => setOrganisationEmail(event.target.value)} required placeholder="contact@organisation.fr" /></label>
              <label htmlFor="organisationTelephone">Téléphone<input id="organisationTelephone" value={organisationTelephone} onChange={(event) => setOrganisationTelephone(event.target.value)} required placeholder="01 02 03 04 05" /></label>
              <label htmlFor="bibliothequeNom">Nom de la bibliothèque<input id="bibliothequeNom" value={bibliothequeNom} onChange={(event) => setBibliothequeNom(event.target.value)} required placeholder="Bibliothèque principale" /></label>
              <label htmlFor="bibliothequeAdresse">Adresse<input id="bibliothequeAdresse" value={bibliothequeAdresse} onChange={(event) => setBibliothequeAdresse(event.target.value)} placeholder="Adresse (facultatif)" /></label>
            </>}
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "En cours…" : isRegistering ? "Créer l&apos;espace" : "Ouvrir la session"}<span>→</span></button>
          </form>
          <button type="button" className="login-switch" onClick={() => { setIsRegistering(!isRegistering); setError(""); }}>{isRegistering ? "J&apos;ai déjà un compte" : "Créer un espace en ligne"}</button>
          <div className="login-meta"><span className="secure-dot" />Connexion sécurisée par JWT</div>
        </div>
      </section>
    </main>
  );
}
