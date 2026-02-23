import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";
import * as React from "react";

interface AuthEmailTemplateProps {
  type: "email-verification" | "forgot-password";
  url: string;
}

export const AuthEmailTemplate = ({ type, url }: AuthEmailTemplateProps) => {
  const isVerification = type === "email-verification";
  const title = isVerification ? "Verify your email" : "Reset your password";
  const previewText = isVerification
    ? "Welcome to Quest! Please verify your email."
    : "Reset your Quest password.";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{title}</Heading>
          </Section>
          <Section style={content}>
            <Text style={text}>
              {isVerification
                ? "Thank you for signing up for Quest! To get started, please verify your email address by clicking the button below."
                : "We received a request to reset your password for your Quest account. If you didn't make this request, you can safely ignore this email."}
            </Text>
            <Section style={btnContainer}>
              <Button style={button} href={url}>
                {isVerification ? "Verify Email" : "Reset Password"}
              </Button>
            </Section>
            <Text style={subtext}>
              If you&apos;re having trouble clicking the button, copy and paste the URL below into
              your web browser:
            </Text>
            <Link href={url} style={link}>
              {url}
            </Link>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Quest. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header = {
  padding: "0 0 20px",
};

const h1 = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "left" as const,
};

const content = {
  padding: "0",
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const subtext = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "24px 0 8px",
};

const btnContainer = {
  textAlign: "left" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const link = {
  color: "#111827",
  fontSize: "12px",
  textDecoration: "none",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "40px 0 20px",
};

const footer = {
  textAlign: "left" as const,
};

const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};
