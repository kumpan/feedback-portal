import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
} from "@react-email/components";

export interface EmailTemplateProps {
  clientName: string;
  surveyUrl: string;
  senderName: string;
  senderImage?: string | null;
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({
  clientName,
  surveyUrl,
  senderName,
  senderImage,
}) => {
  const clientFirstName = clientName.split(" ")[0];
  const senderFirstName = senderName.split(" ")[0];

  const previewText = `En kort enkät om din upplevelse av samarbetet med ${senderFirstName} från Kumpan`;

  return (
    <Html>
      <Head>
        <style type="text/css">
          {`
            @media only screen and (max-width: 648px) {
              .mobile-container {
                background-color: #F0F0FE !important;
                border: 0px solid #CDC4E5 !important;
                border-radius: 0px !important;
                padding: 20px !important;
              }
              .mobile-main {
                padding: 32px 0px !important;
              }
            }
          `}
        </style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main} className="mobile-main">
        <Container style={container} className="mobile-container">
          <Img
            src={`${process.env.NEXT_PUBLIC_URL || "https://feedback.kumpan.se"}/images/kumpan-logo.png`}
            alt="Kumpan Logo"
            width="56"
            height="56"
            style={logo}
          />
          <Heading style={heading}>Hej {clientFirstName} 👋</Heading>
          <Text style={paragraph}>
            Du arbetade nyligen med mig, {senderFirstName}, på Kumpan, och vi
            värdesätter din feedback högt. Kan du svara på enkäten om hur du
            upplevde vårt samarbete tillsammans? Det tar bara nåon minut.
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
          <Section style={{ textAlign: "center" }}>
            {senderImage && (
              <Section>
                <Row>
                  <Column align="center">
                    <Img
                      src={senderImage}
                      width="56"
                      height="56"
                      alt={`${senderFirstName}'s profile`}
                      style={{
                        borderRadius: "8px",
                        margin: "0 auto",
                        display: "block",
                      }}
                    />
                  </Column>
                </Row>
              </Section>
            )}
            <Text style={footer}>Skickad av {senderName}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#F0F0FE",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: "60px 16px",
};

const container = {
  backgroundColor: "#FAFAFF",
  border: "1px solid #CDC4E5",
  borderRadius: "20px",
  margin: "0 auto",
  padding: "44px",
  maxWidth: "640px",
};

const logo = {
  margin: "0 auto 20px",
  display: "block",
};

const heading = {
  color: "#451484",
  fontSize: "44px",
  marginBottom: "16px",
  marginTop: "16px",
  textAlign: "center" as const,
  fontWeight: "normal",
};

const paragraph = {
  color: "#250C4A",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "8px",
  textAlign: "center" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#451484",
  borderRadius: "8px",
  color: "#FAFAFF",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
  margin: "8px 0",
};

const link = {
  color: "#451484",
  fontSize: "16px",
  marginBottom: "32px",
  wordBreak: "break-all" as const,
  textAlign: "center" as const,
};

const hr = {
  borderColor: "#E6E6FF",
  margin: "30px 0",
};

const footer = {
  color: "#1E0C4F",
  fontSize: "16px",
  marginTop: "12px",
  textAlign: "center" as const,
};

export default EmailTemplate;
