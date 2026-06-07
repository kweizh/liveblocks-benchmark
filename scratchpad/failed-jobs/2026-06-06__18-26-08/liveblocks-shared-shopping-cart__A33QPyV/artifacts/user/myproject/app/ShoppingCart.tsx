"use client";

import { useStorage, useMutation } from "@liveblocks/react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { CartItem } from "./providers";

export default function ShoppingCart() {
  // Read the cart array from Liveblocks Storage
  const cart = useStorage((root: any) => root.cart) as readonly CartItem[] | null;

  // Add product mutation
  const addProduct = useMutation(({ storage }, productId: string) => {
    const cartList = storage.get("cart") as LiveList<LiveObject<CartItem>> | undefined;
    if (!cartList) return;

    let found = false;
    for (let i = 0; i < cartList.length; i++) {
      const item = cartList.get(i);
      if (item && item.get("id") === productId) {
        item.set("qty", item.get("qty") + 1);
        found = true;
        break;
      }
    }

    if (!found) {
      const nameMap: Record<string, string> = {
        apple: "Apple",
        bread: "Bread",
        milk: "Milk",
      };
      const name = nameMap[productId] || productId;
      cartList.push(new LiveObject<CartItem>({ id: productId, name, qty: 1 }));
    }
  }, []);

  // Remove product mutation
  const removeProduct = useMutation(({ storage }, productId: string) => {
    const cartList = storage.get("cart") as LiveList<LiveObject<CartItem>> | undefined;
    if (!cartList) return;

    for (let i = 0; i < cartList.length; i++) {
      const item = cartList.get(i);
      if (item && item.get("id") === productId) {
        cartList.delete(i);
        break;
      }
    }
  }, []);

  // Calculate total quantity
  const totalQty = cart ? cart.reduce((sum, item) => sum + (item.qty || 0), 0) : 0;

  return (
    <div>
      <h1>Shared Shopping Cart</h1>

      <h2>Catalog</h2>
      <div className="catalog">
        <button data-add-product="apple" onClick={() => addProduct("apple")}>
          Add Apple
        </button>
        <button data-add-product="bread" onClick={() => addProduct("bread")}>
          Add Bread
        </button>
        <button data-add-product="milk" onClick={() => addProduct("milk")}>
          Add Milk
        </button>
      </div>

      <h2>Cart</h2>
      <ul id="cart-items">
        {cart &&
          cart.map((item) => (
            <li
              key={item.id}
              data-cart-item={item.id}
              data-qty={item.qty}
            >
              <span>
                {item.name} (x{item.qty})
              </span>
              <button
                data-remove-item={item.id}
                onClick={() => removeProduct(item.id)}
              >
                Remove
              </button>
            </li>
          ))}
      </ul>

      <div className="total">
        Total Quantity: <span id="cart-total-qty">{totalQty}</span>
      </div>
    </div>
  );
}
