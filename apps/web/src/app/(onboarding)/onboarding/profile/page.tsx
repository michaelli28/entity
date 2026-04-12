"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ShimmerButton } from "@zstar/ui";

import { StepIndicator } from "@/components/onboarding/step-indicator";
import { WizardCard } from "@/components/onboarding/wizard-card";

const schema = z.object({
  name: z.string().min(1, "Required").max(100),
  company_name: z.string().min(1, "Required").max(100),
  one_liner: z.string().min(10, "At least 10 chars").max(280),
  stage: z.enum(["idea", "pre_seed", "seed", "series_a", "series_b_plus"]),
  what_would_make_10x: z.enum([
    "better_intros",
    "better_coaching",
    "signal_scoring",
    "peer_network",
    "other",
  ]),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileStep() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    await fetch("/api/founders/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        what_would_make_10x: values.what_would_make_10x,
      }),
    });
    await fetch("/api/founders/me/startup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: values.company_name,
        one_liner: values.one_liner,
        stage: values.stage,
      }),
    });
    router.push("/onboarding/ready");
  };

  return (
    <WizardCard>
      <StepIndicator step={2} />
      <h1 className="mb-6 text-2xl font-semibold">
        Tell me about you and your startup
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm">Your name</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm">Company name</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            {...register("company_name")}
          />
          {errors.company_name && (
            <p className="mt-1 text-xs text-red-400">
              {errors.company_name.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm">
            One-liner (what you do in one sentence)
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            {...register("one_liner")}
          />
          {errors.one_liner && (
            <p className="mt-1 text-xs text-red-400">
              {errors.one_liner.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm">Stage</label>
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            {...register("stage")}
          >
            <option value="idea">Idea</option>
            <option value="pre_seed">Pre-seed</option>
            <option value="seed">Seed</option>
            <option value="series_a">Series A</option>
            <option value="series_b_plus">Series B+</option>
          </select>
        </div>
        <div>
          <label className="text-sm">
            What would make this a 10/10 for you?
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            {...register("what_would_make_10x")}
          >
            <option value="better_intros">Better investor intros</option>
            <option value="better_coaching">Better coaching on my pitch</option>
            <option value="signal_scoring">
              Signal scoring / readiness assessment
            </option>
            <option value="peer_network">Peer founder network</option>
            <option value="other">Other</option>
          </select>
        </div>
        <ShimmerButton type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Saving..." : "Continue"}
        </ShimmerButton>
      </form>
    </WizardCard>
  );
}
