import { Container, Button, Eyebrow, Card } from "@/components/ui";

export const metadata = { title: "The Chair — FSTR Cuts" };

export default function AboutPage() {
  return (
    <Container className="py-12">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="aspect-[4/5] rounded-3xl bg-[linear-gradient(135deg,#e7e5df,#d5d3cb)]" aria-hidden />
        <div>
          <Eyebrow>The chair</Eyebrow>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Kane.</h1>
          <p className="mt-4 text-lg text-steel">
            One barber, one chair, a proper home studio in the Wallsend area. No queue, no
            walk-ins, no rush — just a good cut on a quiet weekday while the high street&apos;s
            rammed.
          </p>
          <p className="mt-4 text-steel">
            I keep it small on purpose. 130 seats, that&apos;s it. It means I know your name, your
            usual, and I&apos;m never running 40 minutes behind. Quality cuts, no corners.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Card className="!bg-mist">
              <p className="text-sm font-medium">Getting here</p>
              <p className="mt-1 text-sm text-steel">
                Wallsend area, easy off the Coast Road. Street parking right outside. On the Metro?
                Two minutes from the station.
              </p>
            </Card>
            <Card className="!bg-mist">
              <p className="text-sm font-medium">The address</p>
              <p className="mt-1 text-sm text-steel">
                It&apos;s my home, so the exact address stays private — it lands 24 hours before your
                cut, with the door and parking notes.
              </p>
            </Card>
          </div>

          <Button href="/join" className="mt-8">Take a seat</Button>
        </div>
      </div>
    </Container>
  );
}
