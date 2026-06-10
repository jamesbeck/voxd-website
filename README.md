This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Admin AI Models

Admin-triggered AI requests are provider-aware and use the partner or organisation's configured provider API key. Text and image model ids are configured via environment variables. Embedding models are resolved per agent from the database.

Set the model ids for the providers you want to support:

```bash
ADMIN_AI_OPENAI_TEXT_MODEL=
ADMIN_AI_OPENAI_IMAGE_MODEL=

ADMIN_AI_GOOGLE_TEXT_MODEL=
ADMIN_AI_GOOGLE_IMAGE_MODEL=

ADMIN_AI_ANTHROPIC_TEXT_MODEL=
ADMIN_AI_GROQ_TEXT_MODEL=
```

Anthropic and Groq are currently wired for text generation in the admin area. OpenAI and Google are wired for text and image-capable model resolution. Embeddings use each agent's configured embedding model.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
