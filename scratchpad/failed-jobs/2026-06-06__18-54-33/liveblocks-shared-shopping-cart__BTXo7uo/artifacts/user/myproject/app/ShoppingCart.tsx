"use client";

import { LiveObject } from "@liveblocks/client";
import { useStorage, useMutation } from "../liveblocks.config";

const CATALOG = [
  { id: "apple", name: "Apple" },
  { id: "bread", name: "Bread" },
  { id: "milk", name: "Milk" },
];

export function ShoppingCart() {
  const cart = useStorage((root) => root.cart);

  const addItem = useMutation(({ storage }, id: string, name: string) => {
    const cartList = storage.get("cart");
    for (let i = 0; i < cartList.length; i++) {
      const item = cartList.get(i);
      if (item && item.get("id") === id) {
        item.set("qty", item.get("qty") + 1);
        return;
      }
    }
    cartList.push(new LiveObject({ id, name, qty: 1 }));
  }, []);

  const removeItem = useMutation(({ storage }, id: string) => {
    const cartList = storage.get("cart");
    for (let i = 0; i < cartList.length; i++) {
      const item = cartList.get(i);
      if (item && item.get("id") === id) {
        cartList.delete(i);
        return;
      }
    }
  }, []);

  const totalQty = cart ? cart.reduce((sum, item) => sum + item.qty, 0) : 0;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "40px auto", padding: "0 20px" }}>
      <h1>Shared Shopping Cart</h1>

      <div style={{ marginBottom: 24 }}>
        <h2>Products</h2>
        {CATALOG.map(({ id, name }) => (
          <button
            key={id}
            data-add-product={id}
            onClick={() => addItem(id, name)}
            style={{
              marginRight: 8,
              padding: "8px 16px",
              cursor: "pointer",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            Add {name}
          </button>
        ))}
      </div>

      <div>
        <h2>
          Cart (<span id="cart-total-qty">{totalQty}</span> items)
        </h2>
        <ul id="cart-items" style={{ listStyle: "none", padding: 0 }}>
          {cart &&
            cart.map((item) => (
              <li
                key={item.id}
                data-cart-item={item.id}
                data-qty={item.qty}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ flex: 1 }}>
                  {item.name} &times; {item.qty}
                </span>
                <button
                  data-remove-item={item.id}
                  onClick={() => removeItem(item.id)}
                  style={{
                    padding: "4px 10px",
                    cursor: "pointer",
                    backgroundColor: "#e00",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
        </ul>
        {cart && cart.length === 0 && (
          <p style={{ color: "#999" }}>Your cart is empty.</p>
        )}
      </div>
    </div>
  );
}
