"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { MembershipStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Create a new membership tier
 * Only OWNER role can create membership tiers
 */
export async function createMembershipTier(data: {
  salonId: string;
  name: string;
  price: number;
  benefits: Record<string, any>;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (session.user.role !== "OWNER") {
      return {
        success: false,
        error: "Only salon owners can create membership tiers",
      };
    }

    // Verify the user owns this salon
    if (session.user.salonId !== data.salonId) {
      return {
        success: false,
        error: "You can only create tiers for your own salon",
      };
    }

    const tier = await db.membershipTier.create({
      data: {
        salonId: data.salonId,
        name: data.name,
        price: data.price,
        benefits: data.benefits,
      },
    });

    revalidatePath("/dashboard/memberships");
    return { success: true, data: tier };
  } catch (error) {
    console.error("Error creating membership tier:", error);
    return { success: false, error: "Failed to create membership tier" };
  }
}

/**
 * Get all membership tiers for a salon
 */
export async function getMembershipTiers(salonId: string) {
  try {
    const tiers = await db.membershipTier.findMany({
      where: {
        salonId,
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    });

    return { success: true, data: tiers };
  } catch (error) {
    console.error("Error fetching membership tiers:", error);
    return { success: false, error: "Failed to fetch membership tiers" };
  }
}

/**
 * Create a new membership subscription
 * Includes Stripe subscription creation with retry logic
 */
export async function createMembership(data: {
  clientId: string;
  tierId: string;
  paymentMethodId?: string;
}) {
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      // Fetch the membership tier
      const tier = await db.membershipTier.findUnique({
        where: { id: data.tierId },
        include: { salon: true },
      });

      if (!tier) {
        return { success: false, error: "Membership tier not found" };
      }

      // Fetch the client
      const client = await db.client.findUnique({
        where: { id: data.clientId },
      });

      if (!client) {
        return { success: false, error: "Client not found" };
      }

      if (!client.email) {
        return {
          success: false,
          error: "Client must have an email to create a membership",
        };
      }

      // Create or retrieve Stripe customer
      let stripeCustomerId: string | undefined;

      // Check if client has existing memberships with Stripe customer
      const existingMembership = await db.membership.findFirst({
        where: {
          clientId: data.clientId,
          stripeSubscriptionId: { not: null },
        },
      });

      if (existingMembership?.stripeSubscriptionId) {
        // Fetch the subscription to get customer ID
        try {
          const subscription = await stripe.subscriptions.retrieve(
            existingMembership.stripeSubscriptionId
          );
          stripeCustomerId = subscription.customer as string;
        } catch (error) {
          console.error("Error fetching existing subscription:", error);
        }
      }

      // Create new Stripe customer if needed
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: client.email,
          name: client.name,
          metadata: {
            clientId: client.id,
            salonId: tier.salonId,
          },
        });
        stripeCustomerId = customer.id;
      }

      // Attach payment method if provided
      if (data.paymentMethodId) {
        await stripe.paymentMethods.attach(data.paymentMethodId, {
          customer: stripeCustomerId,
        });

        // Set as default payment method
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: data.paymentMethodId,
          },
        });
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${tier.name} - ${tier.salon.name}`,
                metadata: {
                  tierId: tier.id,
                  salonId: tier.salonId,
                },
              },
              recurring: {
                interval: "month",
              },
              unit_amount: Math.round(Number(tier.price) * 100), // Convert to cents
            },
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          clientId: client.id,
          tierId: tier.id,
          salonId: tier.salonId,
        },
      });

      // Create membership record in database
      const membership = await db.membership.create({
        data: {
          clientId: data.clientId,
          salonId: tier.salonId,
          tierId: data.tierId,
          status: MembershipStatus.ACTIVE,
          startDate: new Date(),
          stripeSubscriptionId: subscription.id,
        },
        include: {
          tier: true,
          client: true,
        },
      });

      revalidatePath("/dashboard/memberships");
      revalidatePath("/dashboard/clients");
      revalidatePath(`/portal/${data.clientId}`);

      return {
        success: true,
        data: {
          membership,
          clientSecret:
            // @ts-ignore - Stripe types are complex
            subscription.latest_invoice?.payment_intent?.client_secret,
        },
      };
    } catch (error: any) {
      console.error(`Membership creation attempt ${attempts} failed:`, error);

      // If this was the last attempt, return error
      if (attempts >= maxAttempts) {
        return {
          success: false,
          error: error?.message || "Failed to create membership after multiple attempts",
        };
      }

      // Otherwise, wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { success: false, error: "Failed to create membership" };
}

/**
 * Cancel a membership subscription
 */
export async function cancelMembership(membershipId: string, reason?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch the membership
    const membership = await db.membership.findUnique({
      where: { id: membershipId },
      include: {
        client: true,
        tier: true,
      },
    });

    if (!membership) {
      return { success: false, error: "Membership not found" };
    }

    // Authorization check: OWNER/STAFF can cancel, or CLIENT can cancel their own
    if (
      session.user.role !== "OWNER" &&
      session.user.role !== "STAFF" &&
      membership.clientId !== session.user.id
    ) {
      return {
        success: false,
        error: "You are not authorized to cancel this membership",
      };
    }

    // Cancel Stripe subscription if exists
    if (membership.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(membership.stripeSubscriptionId, {
          cancellation_details: reason ? { comment: reason } : undefined,
        });
      } catch (error) {
        console.error("Error canceling Stripe subscription:", error);
        // Continue with local cancellation even if Stripe fails
      }
    }

    // Update membership status
    const updatedMembership = await db.membership.update({
      where: { id: membershipId },
      data: {
        status: MembershipStatus.CANCELLED,
        endDate: new Date(),
      },
      include: {
        tier: true,
        client: true,
      },
    });

    revalidatePath("/dashboard/memberships");
    revalidatePath("/dashboard/clients");
    revalidatePath(`/portal/${membership.clientId}`);

    return { success: true, data: updatedMembership };
  } catch (error) {
    console.error("Error canceling membership:", error);
    return { success: false, error: "Failed to cancel membership" };
  }
}

/**
 * Get membership by ID
 */
export async function getMembership(membershipId: string) {
  try {
    const membership = await db.membership.findUnique({
      where: { id: membershipId },
      include: {
        tier: true,
        client: true,
        salon: true,
      },
    });

    if (!membership) {
      return { success: false, error: "Membership not found" };
    }

    return { success: true, data: membership };
  } catch (error) {
    console.error("Error fetching membership:", error);
    return { success: false, error: "Failed to fetch membership" };
  }
}

/**
 * Get all memberships for a salon
 */
export async function getMemberships(
  salonId: string,
  filters?: {
    status?: MembershipStatus;
    clientId?: string;
  }
) {
  try {
    const memberships = await db.membership.findMany({
      where: {
        salonId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.clientId && { clientId: filters.clientId }),
      },
      include: {
        tier: true,
        client: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return { success: true, data: memberships };
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return { success: false, error: "Failed to fetch memberships" };
  }
}

/**
 * Get active membership for a client
 */
export async function getActiveMembership(clientId: string) {
  try {
    const membership = await db.membership.findFirst({
      where: {
        clientId,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        tier: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    if (!membership) {
      return { success: true, data: null };
    }

    return { success: true, data: membership };
  } catch (error) {
    console.error("Error fetching active membership:", error);
    return { success: false, error: "Failed to fetch active membership" };
  }
}

/**
 * Update membership tier
 */
export async function updateMembershipTier(
  tierId: string,
  data: {
    name?: string;
    price?: number;
    benefits?: Record<string, any>;
    isActive?: boolean;
  }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "OWNER") {
      return { success: false, error: "Unauthorized" };
    }

    const tier = await db.membershipTier.update({
      where: { id: tierId },
      data,
    });

    revalidatePath("/dashboard/memberships");
    return { success: true, data: tier };
  } catch (error) {
    console.error("Error updating membership tier:", error);
    return { success: false, error: "Failed to update membership tier" };
  }
}
