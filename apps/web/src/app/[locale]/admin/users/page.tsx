import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/orpc/server";
import { Card, CardContent } from "@/components/ui/card";
import { UserRoleSelect } from "@/components/admin/user-role-select";

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const { items } = await api.admin.listUsers({ page: 1 });

  return (
    <Card>
      <CardContent className="pt-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-muted-foreground">
              <th className="pb-2">{t("users")}</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">{t("role")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="py-2 font-medium">{u.name}</td>
                <td className="py-2 text-muted-foreground">{u.email}</td>
                <td className="py-2">
                  <UserRoleSelect userId={u.id} role={u.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
