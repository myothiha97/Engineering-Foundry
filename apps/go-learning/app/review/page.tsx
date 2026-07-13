import { goLessons } from "../../../../content/go";
import { GoReview } from "../../components/go-review";

export const metadata = { title: "Review queue — Go Runtime Lab" };

export default function ReviewPage() {
  return <GoReview lessons={goLessons} />;
}
