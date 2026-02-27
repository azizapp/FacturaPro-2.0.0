
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Client, InvoiceStatus } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateFollowUpEmail = async (invoice: Invoice, clientData: Client): Promise<string> => {
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

export interface InvoiceSummary {
  summary: string;
  insights: string[];
  recommendation: string;
}

export const summarizeInvoices = async (invoices: Invoice[]): Promise<InvoiceSummary> => {
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
