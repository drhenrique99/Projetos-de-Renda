import { GoogleGenAI } from "@google/genai";
import { BetRecord, BetResult } from '../types';

let genAI: GoogleGenAI | null = null;

// Initialize strictly with process.env.API_KEY
if (process.env.API_KEY) {
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const analyzeBet = async (bet: BetRecord, contextKPIs: string): Promise<string> => {
  if (!genAI) return "A chave de API do Gemini não foi configurada. Não é possível gerar a análise detalhada.";

  const prompt = `
    Atue como um analista sênior de apostas esportivas.
    
    Analise a seguinte entrada de aposta (os dados são de uma planilha):
    Competição: ${bet.competition}
    Partida: ${bet.home} vs ${bet.away}
    Mercado: ${bet.market}
    Data: ${bet.date}
    Odds: ${bet.odds}
    Unidades Apostadas: ${bet.units}
    Resultado: ${bet.result}
    Lucro/Prejuízo: ${bet.profitUnits} unidades

    Contexto da Carteira: ${contextKPIs}

    Por favor, forneça uma explicação curta, natural e direta (máximo de 3 frases) em Português sobre:
    1. O que aconteceu (matematicamente).
    2. O impacto na banca.
    3. Uma breve observação sobre o valor da odd (se era arriscada ou conservadora para o resultado).

    Não use formatação markdown complexa, apenas texto corrido. Seja profissional.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a análise.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a inteligência artificial para análise.";
  }
};
