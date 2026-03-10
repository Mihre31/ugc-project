import { Request, Response } from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { prisma } from "../configs/prisma";
import * as Sentry from "@sentry/node";

const clerkWebhooks = async (req: Request, res: Response) => {
  try {
    console.log("1️ Webhook request received");
    const evt: any = await verifyWebhook(req);
    console.log("2️ Webhook verified");
    //Getting data from request
    const { data, type } = evt;
    console.log("3️ Event type:", type);
    //Switch cases for different event
    switch (type) {
      case "user.created": {
        console.log("4️ Creating user");
        await prisma.user.create({
          data: {
            id: data.id,
            email: data?.email_addresses[0]?.email_address,
            name: data?.first_name + " " + data?.last_name,
            image: data?.image_url,
          },
        });
        console.log("5️ User created");
        break;
      }
      case "user.updated": {
        await prisma.user.update({
          where: {
            id: data.id,
          },
          data: {
            email: data?.email_addresses[0]?.email_address,
            name: data?.first_name + " " + data?.last_name,
            image: data?.image_url,
          },
        });
        break;
      }

      case "user.deleted": {
        await prisma.user.delete({
          where: {
            id: data.id,
          },
        });
        break;
      }

      case "paymentAttempt.updated": {
        console.log("4️ Payment event received");
        if (
          (data.charge_type === "recurring" ||
            data.charge_type === "checkout") &&
          data.status === "paid"
        ) {
          console.log("5️ Payment confirmed");

          const credits = { pro: 80, premium: 240 };
          const clerkUserId = data?.payer?.user_id;
          console.log("6️ User ID:", clerkUserId);
          const planId: keyof typeof credits =
            data?.subscription_items?.[0]?.plan?.slug;
          console.log("7️ Plan slug:", planId);
          if (planId !== "pro" && planId !== "premium") {
            return res.status(400).json({ message: "Invalid plan" });
          }
          console.log(planId);
          await prisma.user.update({
            where: { id: clerkUserId },
            data: {
              credits: { increment: credits[planId] },
            },
          });
          console.log("8️ Credits updated");
        }
        break;
      }

      default:
        break;
    }
    console.log("9️ Sending response");
    res.json({ message: "Webhook recieved" + type });
  } catch (error: any) {
    console.log("❌ Webhook error:", error);
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

export default clerkWebhooks;
