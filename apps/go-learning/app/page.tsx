import { goLessons } from "../../../content/go";
import { GoWorkspace } from "../components/go-workspace";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  return <GoWorkspace lessons={goLessons} initialTopicId={topic} />;
}
