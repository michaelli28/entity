# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
import contextlib
from enum import StrEnum

from .client import HAIKU_MODEL, get_client


class Intent(StrEnum):
    STARTUP_COACHING = "startup_coaching"
    OFF_TOPIC = "off_topic"
    HARMFUL = "harmful"
    CRISIS = "crisis"
    INVESTMENT_ADVICE_REQUEST = "investment_advice_request"


CLASSIFIER_SYSTEM = """You are classifying a single user message in an \
ongoing founder↔mentor conversation. Choose exactly one label:

- startup_coaching: the DEFAULT. Anything about the founder's company, \
product, market, team, strategy, fundraising, customers, operations. \
**Also includes every conversational acknowledgment, filler, or follow-up \
within a coaching dialogue** — "ok", "okay", "good", "thanks", "makes \
sense", "got it", "right", "go on", "continue", "yeah", "hmm", "k", "cool", \
"nice", "true", "fair", "sure", "agreed", single-word replies, emojis, \
clarifying questions like "what do you mean?", "why?", "how so?". If in \
doubt, pick this.
- off_topic: unambiguously unrelated to the founder/startup AND not a \
conversational turn — e.g. "write me a python script", "what's the weather", \
"tell me a joke", "help with my homework". Never flag short acknowledgments.
- harmful: requests for illegal activity, hate speech, violence, self-harm \
methods, explicit sexual content.
- crisis: suicidal ideation, hopelessness, severe mental distress.
- investment_advice_request: asking for specific buy/sell decisions, \
legal/tax advice that requires a licensed professional.

Reply with ONLY the category name, nothing else."""


# Conversational acknowledgments — never off-topic. Short-circuited before
# the classifier runs (saves a Haiku call and prevents false positives).
_ACK_PHRASES: frozenset[str] = frozenset({
    "ok", "okay", "k", "kk", "sure", "yes", "yep", "yup", "yeah", "ya",
    "no", "nope", "nah", "maybe", "perhaps",
    "good", "great", "nice", "cool", "awesome", "perfect", "amazing",
    "thanks", "thank you", "ty", "thx", "thanks!",
    "makes sense", "got it", "gotcha", "understood", "right", "correct",
    "true", "fair", "agreed", "exactly", "indeed", "definitely",
    "continue", "go on", "go ahead", "keep going", "next",
    "hmm", "hm", "huh", "ah", "oh", "i see", "ic",
    "lol", "haha", "lmao",
    "why", "why?", "how", "how?", "what?", "when?", "where?",
    "what do you mean", "what do you mean?", "how so", "how so?",
    "tell me more", "more", "elaborate", "go deeper",
})


def _is_conversational_ack(message: str) -> bool:
    """True for short acknowledgments that are always in-bounds in a coaching
    conversation (single words, two-word fillers, punctuation-only)."""
    cleaned = message.strip().lower().rstrip("!?.,;: ")
    if not cleaned:
        return True
    if cleaned in _ACK_PHRASES:
        return True
    # Any message of 3 words or fewer with no digits is almost certainly a
    # conversational turn, not a new topic change.
    words = cleaned.split()
    if len(words) <= 3 and not any(ch.isdigit() for ch in cleaned):
        return True
    return False


CANNED_RESPONSES: dict[Intent, str] = {
    # Intent.OFF_TOPIC intentionally omitted — let the mentor LLM handle
    # off-topic messages in-context so the redirect references prior turns
    # rather than emitting a generic "what are you working on?" line.
    Intent.HARMFUL: (
        "I can't help with that. I'm here to support you on your startup journey."
    ),
    Intent.CRISIS: (
        "It sounds like you're going through something really hard. Please reach "
        "out to someone who can help: 988 Suicide & Crisis Lifeline (call or text "
        "988, US), or your local emergency services. Founders Taking Action "
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
    if _is_conversational_ack(message):
        return Intent.STARTUP_COACHING
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
