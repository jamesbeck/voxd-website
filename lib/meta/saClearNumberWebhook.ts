"use server";

export default async function saClearNumberWebhook({
  numberId,
}: {
  numberId: string;
}) {
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_PRODUCTION_APP!; //process.env.META_ACCESS_TOKEN!;
  const GRAPH_URL = process.env.META_GRAPH_URL!;

  const url = `${GRAPH_URL}/${numberId}`;

  console.log(url);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      webhook_configuration: {
        override_callback_uri: null,
        // verify_token: "",
      },
    }),
  });

  const data = await response.json();

  console.log(data);
  return data;
}
