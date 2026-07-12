import { goLessons } from "../../../content/go";
import { GoWorkspace } from "../components/go-workspace";
export default function Page() {
  return <GoWorkspace lessons={goLessons} />;
}
