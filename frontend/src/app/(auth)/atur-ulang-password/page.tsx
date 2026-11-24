import type { Metadata } from "next";
import { Kontainer } from "@/components/ui/dasar";
import { FormAturUlangPassword } from "@/components/auth/form-atur-ulang-password";

export const metadata: Metadata = { title: "Atur ulang password" };

export default function HalamanAturUlangPassword() {
  return (
    <Kontainer className="py-10 md:py-16">
      <FormAturUlangPassword />
    </Kontainer>
  );
}
