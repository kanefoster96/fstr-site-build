import { changePlanAction } from "@/app/me/actions";
import { gbp } from "@/lib/format";

type PlanPrice = { weeks: number; price: number };

/**
 * Cadence picker: a token every N weeks, priced by how often you come. Longer
 * gaps cost more per cut but less per week. Change once per billing cycle.
 */
export default function PlanPicker({
  plans,
  planPrices,
  current,
  locked,
  from = "me",
}: {
  plans: number[];
  planPrices: PlanPrice[];
  current: number;
  locked: boolean;
  from?: "me" | "profile";
}) {
  const priceFor = (w: number) => planPrices.find((p) => p.weeks === w)?.price;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {plans.map((w) => {
          const isCurrent = w === current;
          const price = priceFor(w);
          return (
            <form key={w} action={changePlanAction}>
              <input type="hidden" name="cycle_weeks" value={w} />
              <input type="hidden" name="from" value={from} />
              <button
                type="submit"
                disabled={isCurrent || locked}
                className={`num rounded-full px-4 py-2 text-sm transition-colors ${
                  isCurrent
                    ? "bg-brass text-ink"
                    : locked
                      ? "border border-steel/30 text-steel/50"
                      : "border border-steel/50 text-ink hover:border-ink hover:bg-mist"
                }`}
              >
                {w} wk{price != null ? ` · ${gbp(price)}` : ""}
              </button>
            </form>
          );
        })}
      </div>
      <p className="num mt-2 text-[11px] text-steel">
        {locked
          ? "One change per cycle — you can switch again after your next token."
          : `A token every ${current} weeks. A longer gap costs a little more per cut. Change once per cycle.`}
      </p>
    </div>
  );
}
