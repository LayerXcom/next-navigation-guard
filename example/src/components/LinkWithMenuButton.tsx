import Link from "next/link";
import { useState } from "react";

// A link containing its own button, like a table row with an actions menu.
// The button handles its click and must not navigate.
export function LinkWithMenuButton({ href }: { href: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div>
      <Link href={href}>
        Row link{" "}
        <button
          style={{ appearance: "auto", padding: 4 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMenuOpen(true);
          }}
        >
          Open row menu
        </button>
      </Link>
      {isMenuOpen && <div>Row menu open</div>}
    </div>
  );
}
