import { SharedPage } from "@/components/SharedPage";
import { PageChangeGuard } from "@/components/PageChangeGuard";

export default function Page2() {
  return (
    <>
      <SharedPage mode="pagesRouter" current={2} />
      <PageChangeGuard />
    </>
  );
}
