import { FastifyInstance } from "fastify";
import { z } from "zod";
import ShortUniqueId from "short-unique-id";

import { prisma } from "../lib/prisma";

export async function pollRoutes(fastify: FastifyInstance) {
	fastify.get("/polls/count", async () => {
		const count = await prisma.poll.count();

		return {
			count
		};
	});

	fastify.post("/polls", async (request, reply) => {
		const createPoolBody = z.object({
			title: z.string()
		});

		const { title } = createPoolBody.parse(request.body);

		const generate = new ShortUniqueId({
			length: 6
		});
		const code = String(generate()).toUpperCase();

		try {
			await request.jwtVerify();

			await prisma.poll.create({
				data: {
					title,
					code,
					ownerId: request.user.sub,

					participants: {
						create: {
							userId: request.user.sub
						}
					}
				}
			});
		} catch {
			await prisma.poll.create({
				data: {
					title,
					code
				}
			});
		}

		return reply.status(201).send({
			code
		});
	});
}
