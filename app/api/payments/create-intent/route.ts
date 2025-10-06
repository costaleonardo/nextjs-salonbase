import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, DEFAULT_CURRENCY, MINIMUM_CHARGE_AMOUNT } from "@/lib/stripe";
import { db } from "@/lib/db";

/**
 * POST /api/payments/create-intent
 *
 * Creates a Stripe Payment Intent for processing credit card payments.
 * This endpoint is used by the client-side Stripe Elements to initialize payment.
 *
 * CRITICAL: This endpoint should only be called after:
 * 1. Gift certificates have been checked
 * 2. User has explicitly selected credit card as payment method
 * 3. User has confirmed the payment amount
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, amount } = body;

    // Validate required fields
    if (!appointmentId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: appointmentId, amount" },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    if (amountInCents < MINIMUM_CHARGE_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum charge amount is $${MINIMUM_CHARGE_AMOUNT / 100}` },
        { status: 400 }
      );
    }

    // Verify appointment exists and belongs to user's salon
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        salonId: session.user.salonId!,
      },
      include: {
        service: true,
        client: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: DEFAULT_CURRENCY,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // For mobile optimization
      },
      metadata: {
        appointmentId,
        salonId: session.user.salonId!,
        clientId: appointment.clientId,
        serviceId: appointment.serviceId,
        source: "salonbase_mvp",
      },
      // Receipt email (optional)
      receipt_email: appointment.client.email || undefined,
      description: `${appointment.service.name} - ${appointment.client.name}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create payment intent",
      },
      { status: 500 }
    );
  }
}
