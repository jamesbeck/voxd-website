"use server";

const apps = [
  {
    name: "Voxd",
    id: 24741739915423743,
    token: process.env.META_ACCESS_TOKEN_PRODUCTION_APP!,
    webhookUrl: "https://voxd-core-tqdxb.ondigitalocean.app/webhook",
  },
  {
    name: "Voxd Test",
    id: 998058092337050,
    token: process.env.META_ACCESS_TOKEN_DEVELOPMENT_APP!,
    webhookUrl: "https://wildcat-lucky-horribly.ngrok-free.app/webhook",
  },
];

export default async function saSetNumberWebhook({
  numberId,
  appName,
}: {
  numberId: string;
  appName: string;
}) {
  const app = apps.find((a) => a.name === appName);

  if (!app) {
    throw new Error(`Unknown app: ${appName}`);
  }

  const ACCESS_TOKEN = app.token;
  const GRAPH_URL = process.env.META_GRAPH_URL!;

  const url = `${GRAPH_URL}/${numberId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      webhook_configuration: {
        override_callback_uri: app.webhookUrl,
        verify_token: process.env.META_VERIFY_TOKEN!,
      },
    }),
  });

  const data = await response.json();

  console.log(data, {
    webhook_configuration: {
      override_callback_uri: app.webhookUrl,
      verify_token: process.env.META_VERIFY_TOKEN!,
    },
  });
  return data;
}
