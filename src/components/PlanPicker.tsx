import { changePlanAction } from "@/app/me/actions";

/**
 * Cadence picker: a token every N weeks. Change once per billing cycle.
 * Same locked price per token — cadence just sets how often one drops.
 */
export default function PlanPicker({
  plans,
  current,
  locked,
  from = "me",
}: {
  plans: number[];
  current: number;
  locked: boolean;
  from?: "me" | "profile";
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {plans.map((w) => {
          const isCurrent = w === current;
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
                {w} wk
              </button>
            </form>
          );
        })}
      </div>
      <p className="num mt-2 text-[11px] text-steel">
        {locked
          ? "One change per cycle — you can switch again after your next token."
          : "A token every " + current + " weeks. Change once per cycle."}
      </p>
    </div>
  );
}
