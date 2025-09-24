import { cn, nl2br } from "@/lib/utils";
import { CheckIcon } from "@heroicons/react/24/solid";

export default function Message({
  role,
  text,
  time,
}: {
  role: string;
  text: string;
  time: string;
}) {
  return (
    <div>
      <style>
        {`
          #message a {
            color: blue;
            text-decoration: underline;
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
          role === "user" ? "flex justify-end" : "flex justify-start"
        )}
      >
        <div
          className={cn(
            "relative max-w-4/5 px-[10px] py-[6px] text-[13px] rounded-[14px] border-[1px] after:content-[''] after:absolute after:bottom-0  after:w-0 after:h-0 after:border-[12px] after:border-transparent  after:border-b-0 after:border-l-0  after:rotate-60",
            role === "user"
              ? "bg-wauserbg after:border-t-wauserbg after:left-full after:-ml-[10px] after:-mb-[4px]"
              : "bg-waagentbg after:border-t-waagentbg after:scale-x-[-1] after:left-0 after:-ml-[6px] after:-mb-[0px]"
          )}
          id="message"
        >
          <div
            dangerouslySetInnerHTML={{ __html: text }}
            className="flex flex-col gap-2"
          />
          <div className="text-[#777] text-[10px] flex justify-end">
            {time}{" "}
            <div className="flex space-x-[-8px] relative top-[1px]">
              <CheckIcon className="w-3 h-3 " />
              <CheckIcon className="w-3 h-3 " />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
