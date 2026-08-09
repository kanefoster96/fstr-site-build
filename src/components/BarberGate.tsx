import { Container, Button } from "./ui";
import Coin from "./Coin";

/** Role gate for /admin/* — prompts to switch to the barber via the dev panel. */
export default function BarberGate() {
  return (
    <Container className="py-20 text-center">
      <Coin size={80} ghost className="mx-auto" />
      <h1 className="mt-6 font-display text-3xl font-bold">Barber only</h1>
      <p className="mx-auto mt-3 max-w-sm text-steel">
        This is Kane&apos;s side of the shop. Switch to the barber role in the dev panel to take a look.
      </p>
      <Button href="/dev" className="mt-6">Open dev panel</Button>
    </Container>
  );
}
