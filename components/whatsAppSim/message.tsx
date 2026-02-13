import { cn } from "@/lib/utils";
import { CheckIcon } from "@heroicons/react/24/solid";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRef } from "react";
import { useInView } from "motion/react";

const InnerMessage = ({
  text,
  time,
  imageUrl,
}: {
  text: string;
  time: string;
  imageUrl?: string;
}) => {
  return (
    <>
      {imageUrl && (
        <div className="mt-[2px] mb-[6px]">
          <img
            src={imageUrl}
            alt="User shared photo"
            className="rounded-[12px] w-full max-w-[220px] h-auto"
          />
        </div>
      )}
      <div
        dangerouslySetInnerHTML={{ __html: text }}
        className="flex flex-col gap-2 text-left [word-break:break-word] [overflow-wrap:anywhere]"
      />
      <div className="text-[#777] text-[10px] flex justify-end">
        {time}{" "}
        <div className="flex space-x-[-8px] relative top-[1px]">
          <CheckIcon className="w-3 h-3 " />
          <CheckIcon className="w-3 h-3 " />
        </div>
      </div>
    </>
  );
};

export default function Message({
  role,
  text,
  time,
  annotation,
  imageUrl,
}: {
  role: string;
  text: string;
  time: string;
  annotation: string;
  imageUrl?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: "all",
    // margin: "100px",
  });

  return (
    <div>
      <style>
        {`
          #message a {
            color: blue;
            text-decoration: underline;
            word-break: break-all;
          }
            

          #message ol {
            list-style-type: decimal;
            margin-left: 20px;
          }

          #message ul {
            list-style-type: disc;
            margin-left: 20px;
          }
        `}
      </style>
      <div
        className={cn(
          role === "user" ? "flex justify-end" : "flex justify-start",
          "relative w-full",
        )}
      >
        <div
          className={cn(
            "relative max-w-[80%] min-w-0 px-[10px] py-[6px] text-[13px] rounded-[14px] border-[1px] after:content-[''] after:absolute after:bottom-0  after:w-0 after:h-0 after:border-[12px] after:border-transparent  after:border-b-0 after:border-l-0  after:rotate-60",
            role === "user"
              ? "bg-wauserbg after:border-t-wauserbg after:left-full after:-ml-[10px] after:-mb-[4px]"
              : "bg-waagentbg after:border-t-waagentbg after:scale-x-[-1] after:left-0 after:-ml-[6px] after:-mb-[0px]",
          )}
          id="message"
        >
          <div className="hidden md:block">
            <Tooltip open={isInView && role === "assistant"}>
              <TooltipTrigger>
                <div ref={ref}>
                  <InnerMessage text={text} time={time} imageUrl={imageUrl} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-[200px]" side="right">
                <p>{annotation}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="block md:hidden">
            <div>
              <InnerMessage text={text} time={time} imageUrl={imageUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
