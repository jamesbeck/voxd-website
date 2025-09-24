import {
  Card,
  CardContent,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IndustryTable, FunctionTable } from "@/types/dbTableTypes";
import Image from "next/image";

export default function ExampleCard({
  id,
  title,
  short,
  slug,
  industries,
  functions,
}: {
  id: string;
  title: string;
  short: string;
  slug: string;
  industries: IndustryTable[];
  functions: FunctionTable[];
}) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-200 flex flex-col">
      <div className="w-full relative h-[150px]">
        <Image
          src={`/examples/${id}.png`}
          alt={`${title} Image`}
          fill
          className="-z-10 object-cover object-center"
        />
      </div>
      <div className="w-full bg-primary px-4 py-2">
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>

      <div className="px-4 pt-4">
        <div className="text-sm" dangerouslySetInnerHTML={{ __html: short }} />
      </div>

      <div className="flex flex-wrap gap-1 px-4 pt-3">
        {industries.map((industry) => (
          <Badge variant="outline" key={industry.id}>
            {industry.name}
          </Badge>
        ))}
        {functions.map((func) => (
          <Badge variant="outline" key={func.id}>
            {func.name}
          </Badge>
        ))}
      </div>

      <div className="p-4 flex gap-2 flex-1 justify-center items-end">
        <Button asChild size="sm" className="w-full">
          <Link href={`/examples/${slug}`}>Read More & Example Chats</Link>
        </Button>
      </div>
    </div>

    // <Card className="w-full md:w-[400px]">
    //   <CardHeader>
    //     <CardTitle>{title}</CardTitle>
    //     <CardDescription className="flex flex-wrap gap-2">
    //       <div dangerouslySetInnerHTML={{ __html: short }} />
    //     </CardDescription>
    //   </CardHeader>
    //   <CardContent>
    //     <Image
    //       src={`/examples/${id}.png`}
    //       alt="Example Image"
    //       width={400}
    //       height={400}
    //     />
    //   </CardContent>
    //   <CardFooter>
    //     <div className="flex flex-col gap-2 w-full">
    //       <Button asChild size="sm">
    //         <Link href={`/examples/${slug}`}>Read Case Study</Link>
    //       </Button>
    //       <Button asChild size="sm">
    //         <Link href={`/examples/${slug}/conversations`}>
    //           View Example Conversations
    //         </Link>
    //       </Button>
    //     </div>
    //   </CardFooter>
    // </Card>
  );
}
