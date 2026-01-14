
import { GoogleGenAI } from "@google/genai";
import { Expense } from "../types";

// Initialize the Google GenAI SDK
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (expenses: Expense[]): Promise<string> => {
  if (expenses.length === 0) {
    return "Ainda não há dados suficientes para uma análise. Registre suas corridas e gastos diários para que eu possa ajudar!";
  }

  const expensesList = expenses.map(e => 
    `- ${e.date}: ${e.description} (R$ ${e.amount.toFixed(2)}) - [${e.category}]`
  ).join('\n');

  const prompt = `
    Você é um consultor financeiro especialista para motoristas de aplicativo (Uber, 99) e motoboys (iFood).
    Analise os seguintes dados financeiros do usuário:

    ${expensesList}

    Por favor, forneça uma análise focada em:
    1. Lucratividade Real: Comente sobre o custo de manutenção e combustível em relação aos gastos gerais.
    2. Alerta de Gastos: Identifique se o usuário está gastando demais em alimentação ou itens não essenciais durante o trabalho.
    3. 3 Dicas Estratégicas: Dê dicas como melhores horários para abastecer, manutenção preventiva ou como aumentar a margem de lucro por KM rodado.
    
    Responda em formato Markdown amigável e direto.
  `;

  try {
    // Corrected model name to gemini-3-flash-preview and ensured use of .text property
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    return response.text || "Não foi possível gerar uma análise estratégica agora.";
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "Encontrei um erro ao processar seus dados de motorista. Tente novamente em breve.";
  }
};