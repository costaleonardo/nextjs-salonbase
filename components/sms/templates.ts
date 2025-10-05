/**
 * SMS Templates
 *
 * Pre-formatted SMS message templates for various notifications.
 * SMS messages should be concise (under 160 characters when possible).
 */

interface AppointmentConfirmationSMSParams {
  salonName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
}

export function appointmentConfirmationSMS({
  salonName,
  serviceName,
  appointmentDate,
  appointmentTime,
}: AppointmentConfirmationSMSParams): string {
  return `${salonName}: Your ${serviceName} appointment is confirmed for ${appointmentDate} at ${appointmentTime}. See you soon!`
}

interface AppointmentReminderSMSParams {
  salonName: string
  serviceName: string
  appointmentTime: string
}

export function appointmentReminderSMS({
  salonName,
  serviceName,
  appointmentTime,
}: AppointmentReminderSMSParams): string {
  return `Reminder: You have a ${serviceName} appointment tomorrow at ${appointmentTime} with ${salonName}. Reply CANCEL if you need to reschedule.`
}

interface AppointmentCancellationSMSParams {
  salonName: string
  appointmentDate: string
  appointmentTime: string
}

export function appointmentCancellationSMS({
  salonName,
  appointmentDate,
  appointmentTime,
}: AppointmentCancellationSMSParams): string {
  return `${salonName}: Your appointment on ${appointmentDate} at ${appointmentTime} has been cancelled.`
}

interface AppointmentRescheduledSMSParams {
  salonName: string
  serviceName: string
  newDate: string
  newTime: string
}

export function appointmentRescheduledSMS({
  salonName,
  serviceName,
  newDate,
  newTime,
}: AppointmentRescheduledSMSParams): string {
  return `${salonName}: Your ${serviceName} appointment has been rescheduled to ${newDate} at ${newTime}.`
}

interface PaymentReceiptSMSParams {
  salonName: string
  amount: string
  paymentMethod: string
}

export function paymentReceiptSMS({
  salonName,
  amount,
  paymentMethod,
}: PaymentReceiptSMSParams): string {
  return `${salonName}: Payment of $${amount} received via ${paymentMethod}. Thank you!`
}
