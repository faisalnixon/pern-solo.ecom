import type { Request, Response } from "express";
import { getEnv } from "../lib/env.js";
import { checkoutSessions, orderItems, orders } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { Webhook } from "standardwebhooks";

function headerString(headers: Request["headers"], name: string) {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
} // this headerString function is used to get the value of a header from the request headers. It takes the headers object and the name of the header as arguments. If the header value is an array, it returns the first element of the array. Otherwise, it returns the value as a string. This is useful for handling headers that may have multiple values, such as "Set-Cookie".

function checkoutSessionIdFromMetadata(order: Record<string, unknown>) {
  const metadata = order.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const sessionId = (metadata as Record<string, unknown>).checkout_session_id;
  return typeof sessionId === "string" ? sessionId : undefined;
}

async function alreadyPaid(polarOrderId?: string, checkoutId?: string) {
  if (polarOrderId) {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.polarOrderId, polarOrderId))
      .limit(1);
    if (row?.status === "paid") return true;
  }
  if (checkoutId) {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.polarCheckoutId, checkoutId))
      .limit(1);
    if (row?.status === "paid") return true;
  }
  return false;
}

async function fulfillCheckoutSession(
  sessionId: string,
  polarOrderId: string | undefined,
  checkoutId: string | undefined,
) {
  return await db.transaction(async (tx) => {
    //transaction means that all the database operations inside this function will be executed as a single unit. If any operation fails, all changes made during the transaction will be rolled back, ensuring data integrity. here session , order , orderItems with lines and checkoutSessions deletiion will be processed together. If any of these operations fail, none of the changes will be saved to the database.
    const [session] = await tx
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, sessionId))
      .for("update");
    // by for("update") means that the selected row will be locked only for update.

    if (!session) return false;

    const [order] = await tx
      .insert(orders)
      .values({
        userId: session.userId,
        status: "paid",
        totalCents: session.totalCents,
        polarCheckoutId: checkoutId ?? session.polarCheckoutId ?? null,
        ...(polarOrderId ? { polarOrderId } : {}),
      })
      .returning();
    // by returning(); means that after inserting the new order into the orders table, the database will return the newly created order record. This allows us to access the properties of the newly created order, such as its id, which we need for inserting related order items in the next step.

    if (session.lines.length) {
      await tx.insert(orderItems).values(
        session.lines.map((line) => ({
          orderId: order.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
      );
    }

    await tx.delete(checkoutSessions).where(eq(checkoutSessions.id, sessionId));

    return true;
  });
}

export async function polarWebhookHandler(req: Request, res: Response) {
  const env = getEnv();

  try {
    if (!env.POLAR_WEBHOOK_SECRET) {
      res.status(503).send("Polar webhooks not configured");
      return;
    }

    const raw =
      req.body instanceof Buffer ? req.body : Buffer.from(String(req.body));
    //req.body instanceof Buffer ? req.body : Buffer.from(String(req.body)); this will ensure that the raw body is a Buffer, even if the request body is a string or other type. This is important because the webhook signature verification requires the raw bytes of the request body.
    // Buffer means

    const wh = new Webhook(
      Buffer.from(env.POLAR_WEBHOOK_SECRET, "utf8").toString("base64"),
      //Buffer.from(env.POLAR_WEBHOOK_SECRET, "utf8") will convert the POLAR_WEBHOOK_SECRET string to a Buffer using UTF-8 encoding. Then, .toString("base64") will convert that Buffer to a base64-encoded string. This is necessary because the Webhook constructor expects the secret to be provided in base64 format.
    );

    const id = headerString(req.headers, "webhook-id");
    const ts = headerString(req.headers, "webhook-timestamp");
    const sig = headerString(req.headers, "webhook-signature");

    if (!id || !ts || !sig) {
      res.status(400).json({ error: "Missing webhook headers" });
      return;
    }

    wh.verify(raw, {
      "webhook-id": id,
      "webhook-timestamp": ts,
      "webhook-signature": sig,
    });

    const event = JSON.parse(raw.toString("utf8")) as {
      type: string;
      data?: Record<string, unknown>;
    };

    if (event.type === "order.paid" && event.data) {
      const data = event.data;
      const polarOrderId = typeof data.id === "string" ? data.id : undefined;
      const checkoutId =
        typeof data.checkout_id === "string" ? data.checkout_id : undefined;

      if (await alreadyPaid(polarOrderId, checkoutId)) {
        res.json({ ok: true, duplicate: true });
        // here duplicate: true means that the order has already been processed and marked as paid, so we don't need to fulfill it again. This prevents duplicate processing of the same order.
        return;
      }

      const sessionId = checkoutSessionIdFromMetadata(data);

      if (sessionId) {
        const ok = await fulfillCheckoutSession(
          sessionId,
          polarOrderId,
          checkoutId,
        );

        if (ok) {
          res.json({ ok: true });
          return;
        }

        if (await alreadyPaid(polarOrderId, checkoutId)) {
          res.json({ ok: true, duplicate: true });
          return;
        }

        console.error("Polar order.paid: could not fulfill checkout session", {
          sessionId,
          checkoutId,
        });

        res.status(500).json({ error: "Checkout fulfillment failed" });
        return;
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Polar webhook error", err);
    res.status(400).json({ error: "Invalid webhook" });
  }
}
