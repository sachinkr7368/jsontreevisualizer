# JSON Tree Visualizer

Interactive JSON Tree Visualizer built with Next.js and React Flow. Paste JSON, visualize it as a hierarchical tree, search with JSONPath, and more.

## Features

- Validate and visualize any JSON
- React Flow tree with colored nodes (object/array/primitive)
- JSONPath search (e.g. `$.user.address.city`, `items[0].name`) with highlight + auto-center
- Zoom, pan, fit view, minimap
- Click node to copy its JSON path
- Tooltip on hover (shows path and value)
- Dark/Light theme toggle (persisted)
- Download canvas as image

## Tech

- Next.js 16.0.10, React 19, Tailwind CSS v4
- React Flow for visualization
- jsonpath-plus for robust JSONPath

## Getting Started

```bash
pnpm i # or npm i / yarn
pnpm dev
```

Open `http://localhost:3000`.

## Deploy

Deploy on Vercel/Netlify. For Vercel:

```bash
pnpm build && pnpm start
```

## Notes

- The layout algorithm is a lightweight layered layout tuned for speed and clarity. For very large JSON, consider server-paginating nodes or virtualizing.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.