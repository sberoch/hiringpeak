"use client";

import { use } from "react";

import { ContactDetailPage } from "@/components/contacts/contact-detail-page";

export default function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ContactDetailPage id={Number(id)} />;
}
