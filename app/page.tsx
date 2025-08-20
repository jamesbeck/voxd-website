import Image from "next/image";

export default function Home() {
  return (
    <div className="px-6 text-center flex flex-col justify-center items-center gap-6">
      <h2 className="text-3xl font-bold">
        Bespoke WhatsApp AI Chatbots – Built Around Your Business
      </h2>
      <p>
        Looking to supercharge your customer communication? Our bespoke
        WhatsApp-powered AI chatbots are designed to fit seamlessly into your
        business.
      </p>

      <ul className="text-left max-w-2xl">
        <li className="mb-2">
          ✅ Integrates with any CRM or backend system – no matter what you use,
          we’ll connect it.
        </li>
        <li className="mb-2">
          ✅ Extremely intelligent – capable of handling even the most complex
          workflows with ease.
        </li>
        <li className="mb-2">
          ✅ Lightning-fast setup – up and running in as little as 1 day.
        </li>
        <li className="mb-2">
          ✅ Simple pricing – <b>zero</b> setup costs, just £199 per month.
        </li>
      </ul>

      <p>
        Whether you need to automate customer support, streamline sales, or
        manage bookings, our AI chatbots work tirelessly to deliver instant,
        reliable responses – 24/7.
      </p>

      <h2 className="text-3xl font-bold">
        Smarter conversations. Faster results.
      </h2>
    </div>
  );
}
