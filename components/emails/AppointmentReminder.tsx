/**
 * Appointment Reminder Email Template
 *
 * Sent 24 hours before the appointment.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface AppointmentReminderEmailProps {
  clientName: string
  serviceName: string
  staffName: string
  appointmentDate: string
  appointmentTime: string
  salonName: string
  salonAddress?: string
  salonPhone?: string
}

export const AppointmentReminderEmail = ({
  clientName,
  serviceName,
  staffName,
  appointmentDate,
  appointmentTime,
  salonName,
  salonAddress,
  salonPhone,
}: AppointmentReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reminder: Your appointment at {salonName} is tomorrow</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Appointment Reminder</Heading>

          <Text style={text}>Hi {clientName},</Text>

          <Text style={text}>
            This is a friendly reminder about your upcoming appointment tomorrow.
          </Text>

          <Section style={appointmentDetails}>
            <Heading as="h2" style={h2}>
              Appointment Details
            </Heading>

            <Text style={detailItem}>
              <strong>Service:</strong> {serviceName}
            </Text>
            <Text style={detailItem}>
              <strong>Provider:</strong> {staffName}
            </Text>
            <Text style={detailItem}>
              <strong>Date:</strong> {appointmentDate}
            </Text>
            <Text style={detailItem}>
              <strong>Time:</strong> {appointmentTime}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={salonInfo}>
            <Heading as="h2" style={h2}>
              {salonName}
            </Heading>
            {salonAddress && <Text style={text}>{salonAddress}</Text>}
            {salonPhone && <Text style={text}>Phone: {salonPhone}</Text>}
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            We look forward to seeing you! If you need to reschedule or cancel, please contact us
            as soon as possible.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default AppointmentReminderEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 20px',
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 20px',
}

const appointmentDetails = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '20px 20px',
  padding: '20px',
}

const detailItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
}

const salonInfo = {
  padding: '0 20px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  padding: '0 20px',
  marginTop: '32px',
}
