import { SharedPage } from "@/components/SharedPage";
import { LinkWithMenuButton } from "@/components/LinkWithMenuButton";

export default function Page1() {
  return (
    <>
      <SharedPage mode="pagesRouter" current={1} />
      <LinkWithMenuButton href="/pages-router/page2" />
    </>
  );
}
