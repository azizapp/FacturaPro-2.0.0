
import { GoogleGenAI } from "@google/genai";
import { Invoice, Client, InvoiceStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFollowUpEmail = async (invoice: Invoice, clientData: Client): Promise<string> => {
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
    return "Erreur lors de la génération de l'email par l'IA.";
  }
};

export const summarizeInvoices = async (invoices: Invoice[]): Promise<any> => {
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
  
  Fournis une réponse JSON strictement respectant ce format :
  {
    "summary": "Résumé de la situation financière en 1 phrase.",
    "insights": ["Observation 1", "Observation 2", "Observation 3"],
    "recommendation": "Conseil stratégique prioritaire"
  }
  Réponds uniquement en français au format JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text || "";
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
