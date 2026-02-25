
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Client, InvoiceStatus } from "../types";

// Get API key from environment or return null if not set
const getApiKey = (): string | null => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_GEMINI_API_KEY || null;
    }
  } catch {
    // Fallback if import.meta is not available
  }
  return null;
};

// Initialize AI client only if API key is available
const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateFollowUpEmail = async (invoice: Invoice, clientData: Client): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API key not configured. Using fallback email generation.");
    return `Bonjour ${clientData.name},\n\nNous vous rappelons que la facture n°${invoice.number} d'un montant de ${invoice.grandTotal.toFixed(2)} MAD est en attente de règlement.\n\nNous vous remercions de bien vouloir procéder au paiement dans les meilleurs délais.\n\nCordialement,`;
  }
  const prompt = `Génère un email professionnel de relance pour la facture suivante :
  Numéro de facture : ${invoice.number}
  Client : ${clientData.name}
  Montant total : ${invoice.grandTotal.toFixed(2)} MAD
  Date d'échéance : ${invoice.date}
  
  L'email doit être poli, professionnel, et rédigé en français. Ne mets pas d'objet, juste le corps du message.`;

  try {
    // Generate content from the model using prompt and model name
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    // Extract text from GenerateContentResponse using .text property
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

  if (!ai) {
    console.warn("Gemini API key not configured. Using fallback summary.");
    return {
      summary: `Bilan financier: CA TTC de ${total.toLocaleString()} MAD avec ${paidCount} factures payées et ${pendingCount} en cours.`,
      insights: [
        `Chiffre d'affaires HT: ${totalHt.toLocaleString()} MAD`,
        `TVA à reverser: ${totalTva.toLocaleString()} MAD`,
        `Taux de recouvrement: ${invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0}%`
      ],
      recommendation: pendingCount > 0 
        ? "Relancez les factures en cours de paiement pour améliorer votre trésorerie."
        : "Votre situation financière est saine. Poursuivez sur cette lancée."
    };
  }

  const prompt = `En tant qu'expert comptable marocain, analyse ce bilan de facturation :
  - CA Total TTC : ${total.toLocaleString()} MAD
  - CA Total HT : ${totalHt.toLocaleString()} MAD
  - TVA à reverser : ${totalTva.toLocaleString()} MAD
  - Factures réglées : ${paidCount}
  - Dossiers en cours : ${pendingCount}
  
  Fournis une réponse JSON en français.`;

  try {
    // Generate structured JSON output using responseSchema for better reliability
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
    // Use .text property to get the generated string
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
