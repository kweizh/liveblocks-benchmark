"use client";

import { useStorage, useMutation, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveObject, LiveList } from "@liveblocks/client";
import { Providers } from "./providers";

type CartItem = {
  id: string;
  name: string;
  qty: number;
};

function Cart() {
  const cart = useStorage((root) => root.cart as readonly CartItem[]);

  const addProduct = useMutation(({ storage }, id: string, name: string) => {
    const mutableCart = storage.get("cart") as LiveList<LiveObject<CartItem>>;
    if (!mutableCart) return;
    const existingItemIndex = mutableCart.findIndex((item) => item.get("id") === id);

    if (existingItemIndex !== -1) {
      const existingItem = mutableCart.get(existingItemIndex);
      if (existingItem) {
        existingItem.set("qty", existingItem.get("qty") + 1);
      }
    } else {
      mutableCart.push(new LiveObject({ id, name, qty: 1 }));
    }
  }, []);

  const removeItem = useMutation(({ storage }, id: string) => {
    const mutableCart = storage.get("cart") as LiveList<LiveObject<CartItem>>;
    if (!mutableCart) return;
    const existingItemIndex = mutableCart.findIndex((item) => item.get("id") === id);

    if (existingItemIndex !== -1) {
      mutableCart.delete(existingItemIndex);
    }
  }, []);

  const totalQty = cart ? cart.reduce((acc, item) => acc + item.qty, 0) : 0;

  return (
    <div>
      <h1>Shopping Cart</h1>
      <div>
        <button data-add-product="apple" onClick={() => addProduct("apple", "Apple")}>Add Apple</button>
        <button data-add-product="bread" onClick={() => addProduct("bread", "Bread")}>Add Bread</button>
        <button data-add-product="milk" onClick={() => addProduct("milk", "Milk")}>Add Milk</button>
      </div>

      <h2>Cart (<span id="cart-total-qty">{totalQty}</span>)</h2>
      <ul id="cart-items">
        {cart && cart.map((item) => (
          <li key={item.id} data-cart-item={item.id} data-qty={item.qty}>
            {item.name} x {item.qty}
            <button data-remove-item={item.id} onClick={() => removeItem(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <ClientSideSuspense fallback={<div>Loading...</div>}>
        {() => <Cart />}
      </ClientSideSuspense>
    </Providers>
  );
}
