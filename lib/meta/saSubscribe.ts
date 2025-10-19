"use server";

const apps = [
  {
    name: "Voxd",
    id: 24741739915423743,
    token: process.env.META_ACCESS_TOKEN_PRODUCTION_APP!,
  },
  {
    name: "Voxd Test",
    id: 998058092337050,
    token: process.env.META_ACCESS_TOKEN_DEVELOPMENT_APP!,
  },
];

export default async function saSubscribe({
  wabaId,
  appName,
  unsubscribe = false,
}: {
  wabaId: string;
  appName: string;
  unsubscribe?: boolean;
}) {
  const app = apps.find((a) => a.name === appName);

  if (!app) {
    throw new Error(`Unknown app: ${appName}`);
  }

  const ACCESS_TOKEN = app.token;
  const GRAPH_URL = process.env.META_GRAPH_URL!;

  const url = `${GRAPH_URL}/${wabaId}/subscribed_apps`;
  const response = await fetch(url, {
    method: unsubscribe ? "DELETE" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  const data = await response.json();

  console.log(data);

  return data;
}
