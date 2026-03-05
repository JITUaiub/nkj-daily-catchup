import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth";

export async function getSession(ctx?: GetServerSidePropsContext) {
  return getServerSession(ctx?.req as any, ctx?.res as any, authOptions);
}
