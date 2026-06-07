"use client";

import { useStorage, useMutation, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { Providers } from "./providers";

const PRODUCTS = [
  { id: "apple", name: "Apple" },
  { id: "bread", name: "Bread" },
  { id: "milk", name: "Milk" },
];

function Cart() {
  const cart = useStorage((root) => root.cart);

  const addItem = useMutation(({ storage }, productId: string) => {
    const cart = storage.get("cart");
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    // Check if item already exists
    let existingIndex = -1;
    for (let i = 0; i < cart.length; i++) {
      if (cart.get(i)?.get("id") === productId) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex >= 0) {
      const existingItem = cart.get(existingIndex)!;
      existingItem.set("qty", existingItem.get("qty") + 1);
    } else {
      cart.push(new LiveObject({ id: product.id, name: product.name, qty: 1 }));
    }
  }, []);

  const removeItem = useMutation(({ storage }, productId: string) => {
    const cart = storage.get("cart");
    for (let i = 0; i < cart.length; i++) {
      if (cart.get(i)?.get("id") === productId) {
        cart.delete(i);
        break;
      }
    }
  }, []);

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="container">
      <h1>Shared Shopping Cart</h1>

      <h2>Add Products</h2>
      <div className="product-buttons">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            data-add-product={product.id}
            onClick={() => addItem(product.id)}
          >
            {product.name}
          </button>
        ))}
      </div>

      <div className="cart-section">
        <h2>Cart</h2>
        {cart.length === 0 ? (
          <p className="empty-cart">Cart is empty</p>
        ) : (
          <ul id="cart-items">
            {cart.map((item) => (
              <li key={item.id} data-cart-item={item.id} data-qty={item.qty}>
                <span>
                  {item.name} × {item.qty}
                </span>
                <button
                  data-remove-item={item.id}
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="total">
          Total items: <span id="cart-total-qty">{totalQty}</span>
        </div>
      </div>
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