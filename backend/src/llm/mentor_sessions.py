from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class SessionKey(StrEnum):
    BIG_PICTURE = "big_picture"
    PROBLEM_MARKET = "problem_market"
    BUSINESS = "business"
    ASK = "ask"
    DEEP_DIVE = "deep_dive"


class SessionBlueprint(BaseModel):
    model_config = ConfigDict(frozen=True)
    key: SessionKey
    title: str
    subtitle: str
    order: int
    system_suffix: str
    target_signals: tuple[str, ...]
    completion_prompt: str
    starter_questions: tuple[str, ...]


KNOWN_SIGNAL_CATEGORIES: frozenset[str] = frozenset({
    "founder", "market", "problem", "competition",
    "product", "traction", "pricing", "team",
})

KNOWN_SIGNAL_KEYS: frozenset[str] = frozenset({
    "founder_background", "product_description", "icp", "market_timing",
    "pain_points", "tam", "competition_analysis", "moat",
    "pricing_model", "traction_metrics", "gtm_strategy", "team_composition",
    "round_size", "terms", "investor_pipeline", "help_needed",
    "mrr_or_revenue", "design_partners", "unit_economics",
})


BIG_PICTURE = SessionBlueprint(
    key=SessionKey.BIG_PICTURE,
    title="The Big Picture",
    subtitle="Who you are, what you're building, who it's for, why now.",
    order=1,
    system_suffix=(
        "SESSION FOCUS: The Big Picture. "
        "Your goal this session is to understand the founder's background, "
        "the product at a high level, the intended customer, and the timing "
        "thesis. Probe for specificity. Do not accept generic ICP "
        "descriptions — force the founder to name a type of person with a "
        "wallet. Keep responses to 2-4 sentences."
    ),
    target_signals=("founder_background", "product_description", "icp", "market_timing"),
    completion_prompt=(
        "The Big Picture session covers: founder background, product "
        "description, ICP, and market timing. Rate coverage 0-100 based on "
        "specificity and completeness, not transcript length."
    ),
    starter_questions=(
        "Let's start with you — what's your background and why this problem?",
        "What are you building, in one sentence?",
        "Who is this for? Describe the person, not the segment.",
        "Why now? What changed in the world that makes this the moment?",
    ),
)

PROBLEM_MARKET = SessionBlueprint(
    key=SessionKey.PROBLEM_MARKET,
    title="The Problem & Market",
    subtitle="The pain, the size, the competition, and your edge.",
    order=2,
    system_suffix=(
        "SESSION FOCUS: The Problem & Market. "
        "Probe for validated pain points with evidence (interviews, data). "
        "Push back on TAM claims without bottoms-up math. Demand an honest "
        "competitive comparison — 'no competitors' is a red flag. Ask what "
        "makes the founder unfairly positioned to win."
    ),
    target_signals=("pain_points", "tam", "competition_analysis", "moat"),
    completion_prompt=(
        "Problem & Market covers: pain points with evidence, TAM, "
        "competition, and moat. Rate 0-100 on specificity and honesty."
    ),
    starter_questions=(
        "What problem are you solving? Who feels it hardest?",
        "How big is this market? Walk me through the bottoms-up TAM.",
        "Who else is solving this? How are you different?",
        "What's your unfair advantage? Why can't a smart competitor copy you?",
    ),
)

BUSINESS = SessionBlueprint(
    key=SessionKey.BUSINESS,
    title="The Business",
    subtitle="Pricing, traction, go-to-market, and team.",
    order=3,
    system_suffix=(
        "SESSION FOCUS: The Business. "
        "Demand quantified traction — MRR/ARR, design partners, unit "
        "economics. Push on pricing logic. Ask for the GTM motion in "
        "detail. Surface team gaps honestly."
    ),
    target_signals=("pricing_model", "traction_metrics", "gtm_strategy", "team_composition"),
    completion_prompt=(
        "The Business covers: pricing, traction metrics, GTM, and team. "
        "Rate 0-100 on quantification and coherence."
    ),
    starter_questions=(
        "How do you make money? What's the pricing logic?",
        "What traction do you have? Give me real numbers.",
        "What's the plan? How do you reach 100 customers?",
        "Who's on the team? What skills are missing?",
    ),
)

ASK = SessionBlueprint(
    key=SessionKey.ASK,
    title="The Ask",
    subtitle="How much, on what terms, and what else you need.",
    order=4,
    system_suffix=(
        "SESSION FOCUS: The Ask. "
        "Probe the round size against the milestones it unlocks. Surface "
        "term expectations. Ask about pipeline status honestly. Beyond "
        "capital, what help does the founder need?"
    ),
    target_signals=("round_size", "terms", "investor_pipeline", "help_needed"),
    completion_prompt=(
        "The Ask covers: round size, terms, investor pipeline, and "
        "non-capital help. Rate 0-100 on honesty and specificity."
    ),
    starter_questions=(
        "How much are you raising? What does it unlock?",
        "What terms are you targeting — SAFE vs priced?",
        "Who have you talked to? Where is the pipeline?",
        "What do you need besides money?",
    ),
)

CORE_BLUEPRINTS: tuple[SessionBlueprint, ...] = (BIG_PICTURE, PROBLEM_MARKET, BUSINESS, ASK)
BY_KEY: dict[SessionKey, SessionBlueprint] = {bp.key: bp for bp in CORE_BLUEPRINTS}


def make_deep_dive_blueprint(target_category: str, target_signal: str) -> SessionBlueprint:
    if target_category not in KNOWN_SIGNAL_CATEGORIES:
        raise ValueError(f"unknown target_category: {target_category!r}")
    if target_signal not in KNOWN_SIGNAL_KEYS:
        raise ValueError(f"unknown target_signal: {target_signal!r}")
    return SessionBlueprint(
        key=SessionKey.DEEP_DIVE,
        title=f"Deep Dive: {target_category.title()}",
        subtitle=f"Rebuild your {target_category} story.",
        order=99,
        system_suffix=(
            f"SESSION FOCUS: Deep Dive on {target_category}. "
            f"This founder's weakest signal is {target_signal}. "
            "Do not survey — interrogate. Ask for numbers, then ask where "
            "the numbers come from. When they give a claim, ask how they "
            "know. End only when the founder can articulate the story with "
            "evidence."
        ),
        target_signals=(target_signal,),
        completion_prompt=(
            f"Deep Dive on {target_category} is complete when the founder "
            f"has given quantified, evidence-backed detail on {target_signal}."
        ),
        starter_questions=(
            f"Let's rebuild your {target_category} story. What's your single "
            f"strongest piece of evidence?",
        ),
    )
