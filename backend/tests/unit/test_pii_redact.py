from src.llm.redact import redact


def test_redacts_ssn() -> None:
    out, n = redact("My SSN is 123-45-6789 and I need help")
    assert "[SSN]" in out
    assert "123-45-6789" not in out
    assert n >= 1


def test_redacts_email_and_phone() -> None:
    out, n = redact("Email foo@bar.com or call +1 415-555-1212")
    assert "[EMAIL]" in out
    assert "[PHONE]" in out
    assert n == 2


def test_no_pii_returns_zero() -> None:
    out, n = redact("Just a regular business question")
    assert n == 0
    assert out == "Just a regular business question"
