"use client";

import { chunk } from "lodash-es";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import { Button } from "~/components/ui/button";
import { type Locale } from "~/dictionaries";
import { api } from "~/trpc/react";
import { cn } from "~/utils";
import { type Options, ToggleOption } from "./toggle-option";
import Link from "next/link";

const Row = ({
  text,
  align = "center",
  className,
  border,
}: {
  text: string;
  align?: "left" | "right" | "center";
  className?: string;
  border?: boolean;
}) => {
  const num = 12;
  const left = Math.floor((num - text.length) / 2) + text.length;

  let data = text.padStart(left).padEnd(num).split("");
  if (align === "right") {
    data = text.padStart(num).split("");
  }

  if (align === "left") {
    data = text.padEnd(num).split("");
  }

  return (
    <div
      className={cn(
        "grid w-full grid-cols-12 border-y",
        !border && "border-transparent",
      )}
    >
      {data.map((item, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center justify-center border-r",
            index === 0 && "border-l",
            !border && "border-transparent",
            className,
          )}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

const ChoosePoem = () => {
  return (
    <aside className="fixed top-0 flex h-full w-72 flex-col bg-muted/50 p-4">
      <Button asChild>
        <Link href="/">选择诗词</Link>
      </Button>
    </aside>
  );
};

const PyRow = ({
  py,
  className,
  border,
  align,
}: {
  py: string;
  className?: string;
  align?: "left" | "right" | "center";
  border?: boolean;
}) => {
  const num = 12;
  const arr = py.split(" ");

  let left = Math.floor((num - arr.length) / 2);

  if (align === "right") {
    left = num - arr.length;
  }

  const data = new Array(12).fill("").map((_, index) => {
    return index < left ? "" : arr[index - left];
  });

  return (
    <div
      className={cn(
        "mt-4 grid h-14 grid-cols-12 border-t text-3xl text-neutral-500",
        className,
        !border && "border-transparent",
      )}
    >
      {data.map((item, index) => (
        <div
          key={index}
          className="relative flex w-full items-center justify-center"
        >
          {border && (
            <>
              <div className="absolute top-1 h-3 w-full border-b-2 border-dashed"></div>
              <div className="absolute bottom-3 h-3 w-full border-b-2 border-dashed"></div>
            </>
          )}
          <span className="relative z-10">{item}</span>
        </div>
      ))}
    </div>
  );
};

export default function PrintPage({
  searchParams,
}: {
  searchParams: { id: string; lang: Locale };
}) {
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `padding:24px`,
  });

  const [opts, setOpts] = useState<Options>({
    translation: true,
    py: false,
    border: true,
  });

  const { data: poem } = api.poem.findById.useQuery({
    id: Number(searchParams.id),
    lang: searchParams.lang,
  });

  if (!poem) return <ChoosePoem />;

  const title = poem.title;
  const author = `${poem.author.dynasty}·${poem.author.name}`;

  const content = poem.content
    .replaceAll("\n", "")
    .match(/[^。|！|？|，|；]+[。|！|？|，|；]+/g);

  if (!content) return <ChoosePoem />;

  const translation = chunk(
    poem.translation?.replaceAll("\n", "").split(""),
    12,
  );

  const arr = [title, author, ...content];
  const py = [
    poem.titlePinYin,
    poem.author.namePinYin,
    ...(poem.contentPinYin ?? "").split("."),
  ];

  return (
    <>
      <div className="flex">
        <aside className="fixed top-0 flex h-full w-72 flex-col space-y-8 bg-muted/50 p-4">
          <Button asChild variant={"outline"}>
            <Link href="/">重新选择诗词</Link>
          </Button>
          <ToggleOption value={opts} onChange={setOpts} />

          {poem.content.split("\n").length > 2 && (
            <p className="text-destructive">律诗不适合开启拼音，不信你试试！</p>
          )}

          <div className="absolute bottom-0 left-0 w-full p-4">
            <Button onClick={handlePrint} className="w-full">
              打印
            </Button>
          </div>
        </aside>
        <aside className="w-72"></aside>

        <div className="relative m-auto min-h-[1754px] w-[938px]">
          <div
            className="w-[938px] space-y-4 font-cursive text-5xl"
            ref={componentRef}
          >
            <div
              className={cn(opts.py ? "min-h-[1334px]" : "h-auto space-y-4")}
            >
              {arr.map((item, index) => (
                <div key={index}>
                  <PyRow
                    py={py[index] ?? ""}
                    align={index === 1 ? "right" : "center"}
                    border={opts.border}
                    className={cn(!opts.py && "hidden")}
                  />
                  <Row
                    border={opts.border}
                    className="h-20 w-20"
                    text={item}
                    align={index === 1 ? "right" : "center"}
                  />
                </div>
              ))}
            </div>

            {opts.translation && (
              <p className="flex h-20 items-center justify-between text-2xl text-neutral-400">
                <span className="text-5xl text-black">译文</span>
                aspoem.com | 现代化中国诗词学习网站
              </p>
            )}

            {opts.translation &&
              translation.map((item) =>
                Row({
                  text: item.join(""),
                  border: opts.border,
                  align: "left",
                  className: "h-20 w-20",
                }),
              )}
          </div>
        </div>
      </div>
    </>
  );
}