import { cn } from "@/lib/utils";
import { CheckIcon } from "@heroicons/react/24/solid";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRef } from "react";
import { useInView } from "motion/react";
import { FileText } from "lucide-react";

const getFileExtension = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toUpperCase() || "";
  return ext;
};

const InnerMessage = ({
  text,
  time,
  imageUrl,
  fileName,
  fileSize,
  role,
}: {
  text: string;
  time: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
  role?: string;
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
      {fileName && (
        <div className="mt-[2px] mb-[8px] max-w-[210px]">
          <div
            className={cn(
              "rounded-[10px] px-[10px] py-[8px] flex items-center gap-[10px] min-w-0",
              role === "user" ? "bg-[#c5e8ba]" : "bg-[#f0f0f0]",
            )}
          >
            <div className="flex-shrink-0">
              <div className="w-[34px] h-[40px] bg-white rounded-[4px] flex items-center justify-center border border-gray-200">
                <FileText className="w-[18px] h-[18px] text-red-500" />
              </div>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[12.5px] font-medium text-[#111] truncate leading-tight">
                {fileName}
              </div>
              <div className="text-[11px] text-[#667781] mt-[1px]">
                {fileSize || ""}
                {fileSize && fileName.includes(".") ? " · " : ""}
                {fileName.includes(".") ? getFileExtension(fileName) : ""}
              </div>
            </div>
          </div>
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
  fileName,
  fileSize,
}: {
  role: string;
  text: string;
  time: string;
  annotation: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
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
                  <InnerMessage
                    text={text}
                    time={time}
                    imageUrl={imageUrl}
                    fileName={fileName}
                    fileSize={fileSize}
                    role={role}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-[200px]" side="right">
                <p>{annotation}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="block md:hidden">
            <div>
              <InnerMessage
                text={text}
                time={time}
                imageUrl={imageUrl}
                fileName={fileName}
                fileSize={fileSize}
                role={role}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
