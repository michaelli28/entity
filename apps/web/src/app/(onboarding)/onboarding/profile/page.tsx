"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
      <p className="zs-onboard-eyebrow">About you</p>
      <h1 className="zs-onboard-headline">
        Who you are, what you&rsquo;re <em>building</em>.
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="zs-form" noValidate>
        <div className="zs-field">
          <label className="zs-field__label" htmlFor="f-name">
            Your name
          </label>
          <input
            id="f-name"
            className="zs-field__input"
            autoComplete="name"
            {...register("name")}
          />
          {errors.name && (
            <p className="zs-field__error">{errors.name.message}</p>
          )}
        </div>

        <div className="zs-field">
          <label className="zs-field__label" htmlFor="f-company">
            Company name
          </label>
          <input
            id="f-company"
            className="zs-field__input"
            autoComplete="organization"
            {...register("company_name")}
          />
          {errors.company_name && (
            <p className="zs-field__error">{errors.company_name.message}</p>
          )}
        </div>

        <div className="zs-field">
          <label className="zs-field__label" htmlFor="f-oneliner">
            One-liner
          </label>
          <input
            id="f-oneliner"
            className="zs-field__input"
            placeholder="What you do in one sentence"
            {...register("one_liner")}
          />
          {errors.one_liner && (
            <p className="zs-field__error">{errors.one_liner.message}</p>
          )}
        </div>

        <div className="zs-field">
          <label className="zs-field__label" htmlFor="f-stage">
            Stage
          </label>
          <select
            id="f-stage"
            className="zs-field__select"
            defaultValue="idea"
            {...register("stage")}
          >
            <option value="idea">Idea</option>
            <option value="pre_seed">Pre-seed</option>
            <option value="seed">Seed</option>
            <option value="series_a">Series A</option>
            <option value="series_b_plus">Series B+</option>
          </select>
        </div>

        <div className="zs-field">
          <label className="zs-field__label" htmlFor="f-10x">
            What would make this a 10/10 for you?
          </label>
          <select
            id="f-10x"
            className="zs-field__select"
            defaultValue="better_coaching"
            {...register("what_would_make_10x")}
          >
            <option value="better_intros">Better investor intros</option>
            <option value="better_coaching">Better coaching on my pitch</option>
            <option value="signal_scoring">Signal scoring / readiness</option>
            <option value="peer_network">Peer founder network</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          type="submit"
          className="zs-btn"
          data-variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Continue"}
          {!isSubmitting && (
            <svg
              className="zs-btn__arrow"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3.5 8h9m0 0L8.5 4m4 4l-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </form>
    </WizardCard>
  );
}
