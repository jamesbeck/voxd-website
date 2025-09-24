"use server";

export default async function saSetNumberWebhook({
  phoneNumberId,
}: {
  phoneNumberId: string;
}) {
  console.log("reg:", phoneNumberId);
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_PRODUCTION_APP!;
  const GRAPH_URL = process.env.META_GRAPH_URL!;

  const url = `${GRAPH_URL}/${phoneNumberId}/register`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      pin: process.env.PHONE_NUMBER_2FA_PIN!,
    }),
  });

  //pins I've used not realising they're important...
  // 212834 - blossom
  // 231084 - io shield

  const data = await response.json();

  console.log(data);

  return data;
}
