export interface ProductAIContent {
  description: string;
  descriptionAr: string;
  seoTitle: string;
  seoTitleAr: string;
  seoKeywords: string[];
}

export async function generateProductContent(
  productName: string,
  category: string,
  features?: string[]
): Promise<ProductAIContent> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an e-commerce copywriter for SAHRAA, a GCC marketplace. Generate product descriptions and SEO content in both Arabic and English. Respond in JSON format only.",
            },
            {
              role: "user",
              content: `Generate content for: ${productName} in category ${category}. Features: ${features?.join(", ") || "N/A"}. Return JSON with: description, descriptionAr, seoTitle, seoTitleAr, seoKeywords (array).`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        return content as ProductAIContent;
      }
    } catch (error) {
      console.error("AI generation failed:", error);
    }
  }

  return generateFallbackContent(productName, category, features);
}

function generateFallbackContent(
  productName: string,
  category: string,
  features?: string[]
): ProductAIContent {
  const featureText = features?.length
    ? ` Features include: ${features.join(", ")}.`
    : "";

  return {
    description: `Discover the premium ${productName} in our ${category} collection.${featureText} Shop now with Cash on Delivery across the GCC.`,
    descriptionAr: `اكتشف ${productName} المميز في قسم ${category}.${featureText ? ` يتميز بـ: ${features?.join("، ")}.` : ""} تسوق الآن مع الدفع عند الاستلام في دول الخليج.`,
    seoTitle: `${productName} - Buy Online | SAHRAA`,
    seoTitleAr: `${productName} - اشترِ أونلاين | صحرا`,
    seoKeywords: [
      productName.toLowerCase(),
      category.toLowerCase(),
      "cod",
      "gcc",
      "sahraa",
      "الدفع عند الاستلام",
    ],
  };
}

export async function chatAssistant(
  message: string,
  context?: { userId?: string; orderId?: string }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return getFallbackResponse(message);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "أنت مساعد صحرا الذكي، مساعد تسوق عربي لسوق إلكتروني في دول الخليج. ساعد العملاء في الطلبات والمنتجات والدفع عند الاستلام. أجب بالعربية بشكل مختصر وودود.",
          },
          {
            role: "user",
            content: `Context: ${JSON.stringify(context || {})}\nUser: ${message}`,
          },
        ],
        max_tokens: 500,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error("Chat assistant error:", error);
  }

  return getFallbackResponse(message);
}

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("طلب") || lower.includes("order")) {
    return "يمكنك تتبع طلبك من لوحة التحكم > طلباتي. هل تحتاج مساعدة في طلب محدد؟";
  }
  if (lower.includes("دفع") || lower.includes("cod") || lower.includes("payment")) {
    return "نوفر الدفع عند الاستلام في جميع دول الخليج. يمكنك أيضاً الدفع ببطاقة الائتمان أو PayPal.";
  }
  if (lower.includes("شحن") || lower.includes("shipping") || lower.includes("توصيل")) {
    return "التوصيل يستغرق 2-5 أيام عمل حسب منطقتك. نتعاون مع أرامكس وسمسا وDHL.";
  }
  return "مرحباً بك في صحرا! كيف يمكنني مساعدتك اليوم؟ يمكنني مساعدتك في الطلبات والمنتجات والشحن.";
}
