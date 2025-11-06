import { useParams } from "react-router-dom";
import { ProjectWorkflowPage } from "@/features/resources/components/ProjectWorkflowPage";

const ProjectPage = () => {
  const { slug } = useParams();

  if (!slug) {
    return null;
  }

  return <ProjectWorkflowPage slug={slug} />;
};

export default ProjectPage;
