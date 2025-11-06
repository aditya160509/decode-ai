"use client";

import { useParams } from "next/navigation";
import { ProjectWorkflowPage } from "@/features/resources/components/ProjectWorkflowPage";

export default function ProjectPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params?.slug[0] : "";

  if (!slug) {
    return null;
  }

  return <ProjectWorkflowPage slug={slug} />;
}
