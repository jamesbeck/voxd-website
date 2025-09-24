"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  PlusIcon,
  CameraIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import Message from "./message";
import { useState } from "react";
import { format, subMinutes } from "date-fns";

export default function WhatsAppSim({
  messages,
}: {
  messages: { role: string; content: string }[];
}) {
  // iphone background image is 1350x2760
  // height is 2.0444444 width

  const [time, setTime] = useState(format(new Date(), "HH:mm"));

  return (
    <div className={cn(`h-[736px] min-w-[360px]`)}>
      <div className={cn(`w-full h-full relative `)}>
        <div className="absolute w-[330px] h-[706px] top-[15px] left-[15px] bg-wabg rounded-[40px]" />

        <Image
          src="/whatsAppSim/iPhone.png"
          alt="WhatsApp"
          width={360}
          height={736}
          className="w-full h-full absolute top-0 left-0"
        />
        <div className="absolute top-[29px] left-[20px]  w-[320px]  h-[680] flex flex-col">
          <div className="mx-auto w-[260px]  h-[30] flex items-center">
            <div className="w-[50%] font-bold text-[16px] pl-[10px]">
              {time}
            </div>
            <div className="w-[50%] flex justify-end space-x-[6px] items-center">
              <div>
                <Image
                  src="/whatsAppSim/bars.svg"
                  alt="Battery"
                  width={20}
                  height={20}
                  className="scale-y-[0.8]"
                />
              </div>
              <div>
                <Image
                  src="/whatsAppSim/wifi.svg"
                  alt="Battery"
                  width={20}
                  height={20}
                />
              </div>
              <div>
                <Image
                  src="/whatsAppSim/black-full-battery.svg"
                  alt="Battery"
                  width={20}
                  height={20}
                />
              </div>
            </div>
          </div>
          <div className="w-full py-[10px] flex items-center">
            <ChevronLeftIcon className="w-8 h-8" />
            <div className="w-[36px] h-[36px] relative ml-[10px]">
              <Image
                src="/whatsAppSim/demoLogo.png"
                alt="Logo"
                fill
                style={{ objectFit: "contain" }}
                className="rounded-full bg-white"
              />
            </div>
            <div className="flex flex-col space-y-[-2px] ml-[10px]">
              <div className="text-[14px] font-bold">VSL Support</div>
              <div className="text-[12px] text-[#777]">Business Account</div>
            </div>
          </div>
          <div className="w-full h-[540px] relative overflow-y-scroll bg-[url(/whatsAppSim/bg.png)] bg-contain bg-repeat ">
            {/* <Image
              src="/whatsAppSim/bg.jpg"
              alt="background"
              fill
              style={{
                objectFit: "cover",
                zIndex: 0,
              }}
              className="opacity-20"
            /> */}

            <div className="relative z-10 flex flex-col space-y-[12px] p-[12px]">
              {messages.map((message, index) => (
                <Message
                  key={index}
                  role={message.role}
                  text={message.content}
                  time={format(
                    subMinutes(
                      new Date(),
                      Math.round(0.3 * (messages.length - index))
                    ),
                    "HH:mm"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="w-full py-[10px] pl-[10px] flex items-center space-x-[10px]">
            <PlusIcon className="w-7 h-7" />
            <div className="w-[190px] h-[26px] rounded-full bg-white border-[1px] border-[#DDD] flex justify-end items-center pr-[10px] relative top-[2px]">
              <Image
                src="/whatsAppSim/sticker.svg"
                alt="Sticker"
                width={24}
                height={24}
                className="w-[22px] h-[22px]"
              />
            </div>
            <CameraIcon className="w-6 h-6" />
            <MicrophoneIcon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
