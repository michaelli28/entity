import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  founderName: string;
  whatIHeard: string;
  investorPushback: string[];
  threeQuestions: string[];
}

export default function WelcomeEmail({
  founderName,
  whatIHeard,
  investorPushback,
  threeQuestions,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          background: "#0b0b10",
          color: "#eee",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <Heading style={{ color: "#a78bfa" }}>
            Your Cold Read, {founderName}
          </Heading>
          <Text>Here&apos;s what I heard from our conversation tonight.</Text>
          <Section
            style={{ background: "#141420", padding: 16, borderRadius: 12 }}
          >
            <Text>{whatIHeard}</Text>
          </Section>
          <Heading as="h2" style={{ fontSize: 18 }}>
            What investors will push on
          </Heading>
          {investorPushback.map((p, i) => (
            <Text key={i}>• {p}</Text>
          ))}
          <Heading as="h2" style={{ fontSize: 18 }}>
            Three questions you can&apos;t yet answer
          </Heading>
          {threeQuestions.map((q, i) => (
            <Text key={i}>• {q}</Text>
          ))}
          <Hr />
          <Text style={{ fontSize: 12, color: "#888" }}>
            Reply to this email with questions, or keep talking in the app.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
