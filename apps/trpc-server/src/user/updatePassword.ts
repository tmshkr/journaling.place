import { ObjectId } from "mongodb";
import { z } from "zod";
import { authorizedProcedure } from "..";

export const updatePassword = authorizedProcedure
  .input(
    z.object({
      salt: z.object({
        type: z.string().regex(/Buffer/),
        data: z.array(z.number()),
      }),
      journals: z.array(
        z.object({
          id: z.string(),
          ciphertext: z.object({
            type: z.string().regex(/Buffer/),
            data: z.array(z.number()),
          }),
          iv: z.object({
            type: z.string().regex(/Buffer/),
            data: z.array(z.number()),
          }),
        })
      ),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { user, mongoClient } = ctx;
    const { salt, journals } = input;

    const session = mongoClient.startSession();
    try {
      session.startTransaction();
      await mongoClient
        .db()
        .collection("User")
        .updateOne(
          {
            _id: new ObjectId(user.id),
          },
          {
            $set: {
              salt: Buffer.from(salt.data),
              updatedAt: new Date(),
            },
          }
        )
        .then((result) => {
          console.log(`User ${user.id} salt updated`, result);
        });

      if (journals.length) {
        await mongoClient
          .db()
          .collection("Journal")
          .bulkWrite(
            journals.map((journal) => {
              return {
                updateOne: {
                  filter: {
                    _id: new ObjectId(journal.id),
                    authorId: new ObjectId(user.id),
                  },
                  update: {
                    $set: {
                      ciphertext: Buffer.from(journal.ciphertext.data),
                      iv: Buffer.from(journal.iv.data),
                    },
                  },
                },
              };
            })
          )
          .then((result) => {
            console.log(`User ${user.id} journals updated`, result);
          });
      }

      await session.commitTransaction();
      console.log("Updated password for user", user.id);
    } catch (error) {
      console.log("An error occurred during the transaction:" + error);
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }

    return "OK";
  });
