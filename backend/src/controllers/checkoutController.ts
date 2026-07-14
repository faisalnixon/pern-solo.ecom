import type { Request, Response, NextFunction } from "express";
import { getEnv } from "../lib/env";
import z from "zod";
import { getAuth } from "@clerk/express";
import { getLocalUser } from "../lib/users";
import { db } from "../db";
import { CheckoutSessionLine, checkoutSessions, products } from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { polarCreateCheckout } from "../lib/polar";

const env = getEnv();

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        // productId: z.string().uuid(),
        productId: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function createCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // only signed-in users can start checkout
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = cartSchema.safeParse(req.body);
    // safeParse will return an object with a success property. If it's false, the input is invalid.
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid cart", details: z.treeifyError(parsed.error) });
      return;
    }

    // polar access token is required
    if (!env.POLAR_ACCESS_TOKEN) {
      res.status(503).json({ error: "Payments are not configured" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const ids = parsed.data.items.map((i) => i.productId);

    // load every cart product that exists, is active, and matches the IDs we asked for.
    const prodRows = await db
      .select()
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.active, true)));

    if (prodRows.length !== ids.length) {
      res.status(400).json({ error: "One or more products are invalid" });
      return;
    }

    const byId = new Map(prodRows.map((p) => [p.id, p]));
    let totalCents = 0;
    const lines: CheckoutSessionLine[] = [];

    for (const line of parsed.data.items) {
      const p = byId.get(line.productId)!;
      // byId will return the product object for the given productId and get will retrieve the value . The exclamation mark (!) is a TypeScript non-null assertion operator, which tells the compiler that we are sure that byId.get(line.productId) will not return undefined. This is safe here because we already checked that all product IDs in the cart exist in the database.
      totalCents += p.priceCents * line.quantity;
      lines.push({
        productId: p.id,
        quantity: line.quantity,
        unitPriceCents: p.priceCents,
      });
    }

    if (totalCents < 10) {
      res.status(400).json({
        error:
          "Total below Polar minimum (e.g. USD requires at least 10 cents)",
      });
      return;
    }

    const [session] = await db
      .insert(checkoutSessions) // insert will create a new row in the checkoutSessions table. The values for the new row are provided in the .values() method.
      .values({
        userId: localUser.id,
        lines,
        totalCents,
        currency: "usd",
      })
      .returning(); // returning() will return the newly created row(s) from the database. In this case, we expect only one row to be created, so we destructure the result to get the first (and only) session.

    const successUrl = `${env.FRONTEND_URL}/checkout/return?checkout_id={CHECKOUT_ID}`;
    const returnUrl = `${env.FRONTEND_URL}/cart`;

    const checkout = await polarCreateCheckout(env, {
      products: [env.POLAR_CHECKOUT_PRODUCT_ID],
      //POLAR_CHECKOUT_PRODUCT_ID is boilerplate product ID that we created in the Polar dashboard. now w r going to overwrite it.
      prices: {
        [env.POLAR_CHECKOUT_PRODUCT_ID]: [
          {
            amount_type: "fixed",
            price_currency: "usd",
            price_amount: totalCents,
          },
        ],
      },

      success_url: successUrl,
      return_url: returnUrl,
      external_customer_id: userId,
      metadata: { checkout_session_id: session.id },
      // metadata: { checkout_session_id: session.id } will be using in the webhooks.
    });

    await db
      .update(checkoutSessions)
      .set({ polarCheckoutId: checkout.id })
      .where(eq(checkoutSessions.id, session.id));

    res.json({ checkoutUrl: checkout.url });
  } catch (e) {
    next(e);
  }
}
