export type Data = Record<string, unknown>;
export type Section = "home" | "catalogue" | "auteurs" | "categories" | "adherents" | "emprunts" | "utilisateurs" | "administration";

export const idOf = (item: Data) => String(item.id || "");
export const textOf = (item: Data, fields: string[]) => fields.map((field) => item[field]).filter(Boolean).join(" ");
