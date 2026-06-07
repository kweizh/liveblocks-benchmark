# Liveblocks Shared Shopping Cart

## Background
You are building a tiny real-time, multiplayer shopping cart with Liveblocks v2 on top of Next.js (App Router). All connected users in the same room see the same cart state and can add or remove products together. Cart state must be persisted in Liveblocks Storage using a `LiveList` of `LiveObject` items, so changes survive when a user disconnects and reconnects.

A Liveblocks account is already provisioned for you. The public key is available in the environment so the browser can connect to Liveblocks directly.

## Requirements
- A Next.js (App Router) application that renders a single page at `/`.
- The page must render a fixed catalog of exactly three product buttons:
  - `<button data-add-product="apple">`
  - `<button data-add-product="bread">`
  - `<button data-add-product="milk">`
- Clicking a product button adds one unit of that product to the shared cart. If an item with the same `id` already exists, only its `qty` must be incremented by one (no duplicate rows).
- The current cart is rendered inside `<ul id="cart-items">`. Each cart row must be `<li data-cart-item="<id>" data-qty="<n>">` where `<id>` is the product id (e.g. `apple`) and `<n>` is the current quantity. The `<li>` may also contain visible text (name, qty) for humans, but the data attributes are mandatory.
- Each `<li>` must contain a `<button data-remove-item="<id>">` that removes the row entirely from the cart.
- A `<span id="cart-total-qty">` must display the sum of `qty` across all items currently in the cart. When the cart is empty it must display `0`.
- All cart state must be synchronized via Liveblocks Storage in real time. Two browser tabs joined to the same room must observe each other's edits.

## Implementation Hints
- This is a Liveblocks v2 React project. Use `@liveblocks/client` and `@liveblocks/react` (the `/suspense` entry point is fine). The cart should live in Storage, not Presence.
- Model the cart as a single `LiveList` of `LiveObject` items shaped like `{ id: string; name: string; qty: number }`. Seed the initial storage from `RoomProvider` so the room boots with an empty cart.
- Connect the browser to Liveblocks using the public key from `process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`. You do not need to implement an `/api/liveblocks-auth` route for this task.
- Use `useStorage` to read the cart (it returns an immutable snapshot suitable for rendering) and `useMutation` to add or remove items. Inside `useMutation` you can call `storage.get("cart")` to obtain the mutable `LiveList` and iterate it to find existing items.
- Liveblocks data structures must only be constructed on the client. In App Router, put `LiveblocksProvider` and `RoomProvider` inside a `"use client"` component.
- The room id must be scoped per run so concurrent evaluations do not collide. Before running the dev server, re-export the run id into a frontend-visible variable, then use it to build the room id:
  ```sh
  export NEXT_PUBLIC_ZEALT_RUN_ID="$ZEALT_RUN_ID"
  ```
  The room id used by `RoomProvider` MUST be `shopping-cart-${NEXT_PUBLIC_ZEALT_RUN_ID}` (read from `process.env.NEXT_PUBLIC_ZEALT_RUN_ID` at build time in the client component).
- After you finish implementing and have manually verified the app, you MUST kill any running `next dev` server before exiting. The verifier will start its own server.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 3000
- Route: `GET /` renders the shopping cart page.
- Page DOM contract:
  - Exactly three product buttons with selectors `button[data-add-product="apple"]`, `button[data-add-product="bread"]`, `button[data-add-product="milk"]` are present.
  - A `<ul id="cart-items">` lists the current cart. Each row is an `<li data-cart-item="<id>" data-qty="<n>">` and contains a `<button data-remove-item="<id>">`.
  - A `<span id="cart-total-qty">` shows the sum of all `qty` values across the cart. When the cart is empty it reads `0`.
- Behavior:
  - Clicking `button[data-add-product="<id>"]` adds the item to the cart if not present, otherwise increments its `qty` by 1.
  - Clicking `button[data-remove-item="<id>"]` removes that row entirely from the cart.
  - The cart state is shared via Liveblocks Storage: two browser contexts joined to the same room observe each other's edits in real time.
- Liveblocks configuration:
  - The browser must authenticate with Liveblocks using `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`.
  - The room id MUST be `shopping-cart-${NEXT_PUBLIC_ZEALT_RUN_ID}`.

