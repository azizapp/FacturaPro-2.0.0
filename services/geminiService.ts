
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Client, InvoiceStatus } from "../types";
import { decrypt } from "./encryptionService";

// Helper to get AI instance with the correct key
const getAIInstance = (customKey?: string) => {
  const key = customKey ? decrypt(customKey) : process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

export const generateFollowUpEmail = async (invoice: Invoice, clientData: Client, aiKey?: string): Promise<string> => {
  const ai = getAIInstance(aiKey);
  
  if (!ai) {
    return "Clé API IA non configurée. Veuillez la configurer dans les paramètres.";
  }

  const prompt = `Génère un email professionnel de relance pour la facture suivante :
  Numéro de facture : ${invoice.number}
  Client : ${clientData.name}
  Montant total : ${invoice.grandTotal.toFixed(2)} MAD
  Date d'échéance : ${invoice.date}
  
  L'email doit être poli, professionnel, et rédigé en français. Ne mets pas d'objet, juste le corps du message.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Impossible de générer l'email.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de la génération de l'email par l'IA. Vérifiez votre clé API.";
  }
};

export const summarizeInvoices = async (invoices: Invoice[], aiKey?: string): Promise<any> => {
  const ai = getAIInstance(aiKey);

  if (!ai) {
    return {
      summary: "IA non configurée.",
      insights: ["Veuillez ajouter votre clé API dans les paramètres"],
      recommendation: "Configuration requise."
    };
  }

  const total = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalHt = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
  const totalTva = invoices.reduce((sum, inv) => sum + (inv.tvaTotal || 0), 0);
  const paidCount = invoices.filter(i => i.status === InvoiceStatus.PAID).length;
  const pendingCount = invoices.filter(i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.PARTIAL).length;

  const prompt = `En tant qu'expert comptable marocain, analyse ce bilan de facturation :
  - CA Total TTC : ${total.toLocaleString()} MAD
  - CA Total HT : ${totalHt.toLocaleString()} MAD
  - TVA à reverser : ${totalTva.toLocaleString()} MAD
  - Factures réglées : ${paidCount}
  - Dossiers en cours : ${pendingCount}
  
  Fournis une réponse JSON en français.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Résumé de la situation financière en 1 phrase.",
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Observations clés sur la situation financière.",
            },
            recommendation: {
              type: Type.STRING,
              description: "Conseil stratégique prioritaire.",
            },
          },
          required: ["summary", "insights", "recommendation"],
        }
      }
    });
    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini JSON Analysis Error:", error);
    return {
      summary: "Analyse indisponible.",
      insights: ["Vérifiez vos paramètres API", "Les données n'ont pu être traitées"],
      recommendation: "Relancez manuellement vos factures en retard."
    };
  }
};
