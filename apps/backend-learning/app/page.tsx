import { backendModule0, backendProcessToService } from "../../../content/backend/module-0";
import { BackendWorkspace } from "../components/backend-workspace";
export default function Page() {
  return <BackendWorkspace lesson={backendProcessToService} moduleTitle={backendModule0.title} />;
}
