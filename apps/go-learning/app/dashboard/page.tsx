import { goLessons } from "../../../../content/go";
import { GoDashboard } from "../../components/go-dashboard";

export const metadata = { title: "Dashboard — Go Runtime Lab" };

export default function DashboardPage() {
  return <GoDashboard lessons={goLessons} />;
}
