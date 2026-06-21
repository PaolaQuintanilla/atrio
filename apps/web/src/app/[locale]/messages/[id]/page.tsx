import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { ChatThread } from "@/components/messaging/chat-thread";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session?.user) redirect({ href: "/sign-in", locale });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ChatThread conversationId={id} myId={session!.user.id} />
    </div>
  );
}
