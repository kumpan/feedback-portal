import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Section,
  Hr,
  Img,
} from "@react-email/components";

interface EmailTemplateProps {
  clientName: string;
  companyName: string;
  surveyUrl: string;
  senderName: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  clientName,
  companyName,
  surveyUrl,
  senderName,
}) => {
  // Extract first names for display
  const clientFirstName = clientName.split(' ')[0];
  const senderFirstName = senderName.split(' ')[0];
  
  const previewText = `En kort enkät om din upplevelse av samarbetet med ${senderFirstName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXT_PUBLIC_URL || 'https://feedback.kumpan.se'}/images/kumpan-logo.svg`}
            alt="Kumpan Logo"
            width="150"
            height="40"
            style={logo}
          />
          <Heading style={heading}>Hej {clientFirstName} 👋</Heading>
          <Text style={paragraph}>
            Du arbetade nyligen med {senderFirstName} på Kumpan, och vi värdesätter
            din feedback högt. Kan du svara på enkäten om hur du upplevde vårt
            samarbete tillsammans? Det tar bara en minut eller två.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={surveyUrl}>
              Till enkäten
            </Button>
          </Section>
          <Text style={paragraph}>
            Alternativt kan du också kopiera och klistra in länken i din
            webbläsare:
          </Text>
          <Text style={link}>{surveyUrl}</Text>
          <Hr style={hr} />
          <Text style={footer}>Skickad av {senderName} från Kumpan</Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: "60px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  borderRadius: "5px",
  margin: "0 auto",
  padding: "40px",
  maxWidth: "600px",
};

const logo = {
  margin: "0 auto 20px",
  display: "block",
};

const heading = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "20px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#444",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  margin: "8px 0",
};

const link = {
  color: "#2563eb",
  fontSize: "14px",
  marginBottom: "20px",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#f0f0f0",
  margin: "30px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  marginTop: "20px",
  textAlign: "center" as const,
};

export default EmailTemplate;
