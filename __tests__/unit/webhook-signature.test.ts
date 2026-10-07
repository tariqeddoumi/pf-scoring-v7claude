import { signerWebhook, verifierSignatureWebhook } from "@/lib/webhook-signature";

const secret = "secret-de-test";
const corps = JSON.stringify({ event: "alert.created", data: {} });
const ts = "1000000";
const base = { secret, timestamp: ts, id: "evt-1", corps, maintenantS: 1000010 };

describe("webhook-signature", () => {
  it("accepte une signature valide", () => {
    const signature = signerWebhook(secret, ts, "evt-1", corps);
    expect(verifierSignatureWebhook({ ...base, signature })).toEqual({ ok: true });
  });

  it("refuse un en-tête arbitraire (constat F06)", () => {
    expect(verifierSignatureWebhook({ ...base, signature: "n-importe-quoi" })).toEqual({ ok: false, motif: "signature" });
  });

  it("refuse un corps modifié", () => {
    const signature = signerWebhook(secret, ts, "evt-1", corps);
    expect(verifierSignatureWebhook({ ...base, corps: corps + " ", signature }).ok).toBe(false);
  });

  it("refuse un horodatage trop ancien", () => {
    const signature = signerWebhook(secret, ts, "evt-1", corps);
    expect(verifierSignatureWebhook({ ...base, signature, maintenantS: 1000000 + 301 })).toEqual({ ok: false, motif: "horodatage" });
  });

  it("refuse un rejeu et l'absence de secret", () => {
    const signature = signerWebhook(secret, ts, "evt-1", corps);
    expect(verifierSignatureWebhook({ ...base, signature, dejaVu: () => true })).toEqual({ ok: false, motif: "rejeu" });
    expect(verifierSignatureWebhook({ ...base, secret: undefined, signature })).toEqual({ ok: false, motif: "non_configure" });
  });
});
