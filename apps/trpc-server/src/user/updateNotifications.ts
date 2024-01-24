import { ObjectId } from "mongodb";
import { NotificationTopic } from "@prisma/client";
import { z } from "zod";
import { authorizedProcedure } from "..";

export const updateNotifications = authorizedProcedure
  .input(
    z.object({
      field: z.enum(["emailNotifications"]),
      topic: z.enum([NotificationTopic.prompt_of_the_day]),
      subscribe: z.boolean(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { user, mongoClient } = ctx;
    const { field, topic, subscribe } = input;

    const result = await mongoClient
      .db()
      .collection("User")
      .updateOne(
        {
          _id: new ObjectId(user.id),
        },
        subscribe
          ? { $addToSet: { [field]: topic } }
          : { $pull: { [field]: topic } }
      );

    return result;
  });
