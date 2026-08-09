import { Container, Button, Eyebrow, Card } from "@/components/ui";

export const metadata = { title: "The Chair — FSTR" };

export default function AboutPage() {
  return (
    <Container className="py-12">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/adam-portrait.jpg"
          alt="Adam at the FSTR chair"
          className="aspect-[4/5] w-full rounded-3xl object-cover"
        />
        <div>
          <Eyebrow>The Chair</Eyebrow>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
            Just you, me and enough time to get it right.
          </h1>
          <p className="mt-4 text-lg text-steel">
            FSTR is my private home barber studio in the Wallsend area. There&apos;s one chair, no
            crowded waiting area and no queue building behind you.
          </p>
          <p className="mt-4 text-steel">
            We&apos;ll talk through exactly what you want, I&apos;ll take the time to make sure
            you&apos;re happy, and I&apos;ll save the details of your cut — the lengths, the blend, how
            you like it styled — so we get it right again next time.
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
                It&apos;s my home, so the exact address stays private — it&apos;s sent 24 hours before
                your appointment, with the door and parking notes.
              </p>
            </Card>
          </div>

          <p className="mt-6 font-display text-lg font-semibold">— Adam</p>
          <Button href="/join" className="mt-6">Join FSTR</Button>
        </div>
      </div>
    </Container>
  );
}
