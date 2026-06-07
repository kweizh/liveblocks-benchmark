import { LiveblocksProviders } from "./LiveblocksProviders";
import { ShoppingCart } from "./ShoppingCart";

export default function Home() {
  return (
    <LiveblocksProviders>
      <ShoppingCart />
    </LiveblocksProviders>
  );
}
