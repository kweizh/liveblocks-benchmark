"use client";

import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject, LiveList } from "@liveblocks/client";

type CartItem = {
  id: string;
  name: string;
  qty: number;
};

const PRODUCTS = [
  { id: "apple", name: "Apple" },
  { id: "bread", name: "Bread" },
  { id: "milk", name: "Milk" },
];

export default function ShoppingCart() {
  const cart = useStorage((root) => root.cart as unknown as CartItem[]);

  const addToCart = useMutation(({ storage }, productId: string) => {
    const cartList = storage.get("cart") as LiveList<LiveObject<CartItem>>;
    if (!cartList) return;
    
    const existingItemIndex = cartList.findIndex((item) => item.get("id") === productId);

    if (existingItemIndex !== -1) {
      const item = cartList.get(existingItemIndex);
      if (item) {
        item.set("qty", item.get("qty") + 1);
      }
    } else {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (product) {
        cartList.push(
          new LiveObject({
            id: product.id,
            name: product.name,
            qty: 1,
          })
        );
      }
    }
  }, []);

  const removeFromCart = useMutation(({ storage }, productId: string) => {
    const cartList = storage.get("cart") as LiveList<LiveObject<CartItem>>;
    if (!cartList) return;

    const index = cartList.findIndex((item) => item.get("id") === productId);
    if (index !== -1) {
      cartList.delete(index);
    }
  }, []);

  const totalQty = cart ? cart.reduce((acc, item) => acc + item.qty, 0) : 0;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      
      <div className="flex gap-4 mb-8">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            data-add-product={product.id}
            onClick={() => addToCart(product.id)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Add {product.name}
          </button>
        ))}
      </div>

      <div className="mb-4">
        Total Quantity: <span id="cart-total-qty">{totalQty}</span>
      </div>

      <ul id="cart-items" className="space-y-2">
        {cart && cart.map((item) => (
          <li
            key={item.id}
            data-cart-item={item.id}
            data-qty={item.qty}
            className="flex items-center gap-4 p-2 border rounded"
          >
            <span>{item.name} (x{item.qty})</span>
            <button
              data-remove-item={item.id}
              onClick={() => removeFromCart(item.id)}
              className="px-2 py-1 bg-red-500 text-white rounded text-sm"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
