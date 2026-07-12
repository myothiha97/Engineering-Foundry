import { goModule0, goSourceToProcess } from "../../../content/go/module-0";
import { GoWorkspace } from "../components/go-workspace";
export default function Page() {
  return <GoWorkspace lesson={goSourceToProcess} moduleTitle={goModule0.title} />;
}
