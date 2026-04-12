# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
import contextlib
from enum import Enum

from .client import HAIKU_MODEL, get_client


class Intent(str, Enum):
    STARTUP_COACHING = "startup_coaching"
    OFF_TOPIC = "off_topic"
    HARMFUL = "harmful"
    CRISIS = "crisis"
    INVESTMENT_ADVICE_REQUEST = "investment_advice_request"


CLASSIFIER_SYSTEM = """Classify the user message into exactly one of:
- startup_coaching: anything about their company, product, market, team, \
strategy, fundraising, customers, operations
- off_topic: general chit-chat, coding help, personal life unrelated to founder work
- harmful: requests for illegal activity, hate speech, violence, self-harm \
methods, explicit content
- crisis: messages indicating suicidal ideation, hopelessness, severe mental \
distress
- investment_advice_request: asking for specific buy/sell decisions, \
legal/tax advice requiring a licensed professional

Reply with ONLY the category name, nothing else."""


CANNED_RESPONSES: dict[Intent, str] = {
    Intent.OFF_TOPIC: "Let's stay focused on your startup — what are you working on?",
    Intent.HARMFUL: (
        "I can't help with that. I'm here to support you on your startup journey."
    ),
    Intent.CRISIS: (
        "It sounds like you're going through something really hard. Please reach out "
        "to someone who can help: 988 Suicide & Crisis Lifeline (call or text 988, US), "
        "or your local emergency services. Founders Taking Action "
        "(founderstakingaction.com) is a peer support community for founders in "
        "distress. You matter more than your startup — please reach out."
    ),
    Intent.INVESTMENT_ADVICE_REQUEST: (
        "I give general guidance, not investment, legal, or tax advice — for specific "
        "financial decisions talk to a licensed professional. But I can help you think "
        "about the strategy behind it. What's the underlying question?"
    ),
}


async def classify_intent(message: str) -> Intent:
    client = get_client()
    with contextlib.suppress(Exception):
        response = await client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=20,
            temperature=0.0,
            system=CLASSIFIER_SYSTEM,
            messages=[{"role": "user", "content": message[:2000]}],
        )
        block = response.content[0]
        text = getattr(block, "text", "").strip().lower()
        for intent in Intent:
            if intent.value in text:
                return intent
    return Intent.STARTUP_COACHING  # fail-open to the mentor
