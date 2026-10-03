import { randomBytes } from "crypto";

const invitationAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
// 8 caracteres (32^8 ≈ 1,1 billones) para que el código no sea adivinable por
// fuerza bruta: abre datos del invitado incluidas alergias (dato de salud).
// El acceso habitual es por QR, así que no penaliza el tecleo en la práctica.
const invitationCodeLength = 8;

export function normalizeInvitationCode(value: string) {
  return value.replace(/[\s-]/g, "").trim().toUpperCase();
}

export function formatInvitationCode(value: string) {
  const normalized = normalizeInvitationCode(value);

  if (normalized.length <= 3) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}

export function generateInvitationCode(existingCodes: Iterable<string> = []) {
  const usedCodes = new Set(
    Array.from(existingCodes, (value) => normalizeInvitationCode(value)).filter((value) => value.length > 0)
  );

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const bytes = randomBytes(invitationCodeLength);
    let code = "";

    for (const byte of bytes) {
      code += invitationAlphabet[byte % invitationAlphabet.length];
    }

    const normalized = normalizeInvitationCode(code);

    if (!usedCodes.has(normalized)) {
      return normalized;
    }
  }

  throw new Error("No fue posible generar un codigo de invitacion unico.");
}
