"use client";

import saClearNumberWebhook from "@/lib/meta/saClearNumberWebhook";
import saSetNumberWebhook from "@/lib/meta/saSetNumberWebhook";
import saSubscribe from "@/lib/meta/saSubscribe";
import type { Waba } from "@/types/metaTypes";

export default function WabaCard({ waba }: { waba: Waba }) {
  return (
    <div className="p-4 border border-neutral-200 rounded-lg">
      <h2 className="text-lg font-semibold">{waba.name}</h2>
      <p className="text-sm text-neutral-500">{waba.id}</p>
      <p>Account Review Status: {waba.account_review_status}</p>
      <p>Business Verification Status: {waba.business_verification_status}</p>
      <p>Status: {waba.status}</p>
      <p>Ownership Type: {waba.ownership_type}</p>

      <div className="my-8">
        <h3>Subscribed Apps</h3>

        <button
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() =>
            saSubscribe({
              wabaId: waba.id,
              unsubscribe: false,
            })
          }
        >
          Subscribe
        </button>
        <button
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() =>
            saSubscribe({
              wabaId: waba.id,
              unsubscribe: true,
            })
          }
        >
          Unsubscribe
        </button>

        <button
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() =>
            saSubscribe({
              wabaId: waba.id,
              unsubscribe: false,
            })
          }
        >
          Subscribe
        </button>
        <button
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() =>
            saSubscribe({
              wabaId: waba.id,
              unsubscribe: true,
            })
          }
        >
          Unsubscribe
        </button>
        <ul>
          {waba.subscribed_apps?.data.map((app) => (
            <div key={app.whatsapp_business_api_data.id}>
              {app.whatsapp_business_api_data.name}(
              {app.whatsapp_business_api_data.id})
            </div>
          ))}
        </ul>
      </div>
      <div className="my-8">
        <h3>Phone Numbers</h3>

        {waba.phone_numbers?.data.map((p) => (
          <div key={p.id}>
            {waba.phone_numbers?.data.map((p) => (
              <div key={p.id}>
                <div>
                  {p.display_phone_number} ({p.id}) -{" "}
                  {p.code_verification_status} - {p.verified_name}
                </div>
                <div>
                  Application:{" "}
                  {p.webhook_configuration?.application || "Not set"}
                </div>
                <div>WABA: {p.webhook_configuration?.waba || "Not set"}</div>
                <div>
                  Number: {p.webhook_configuration?.phone_number || "Not set"}
                </div>

                <button
                  style={{
                    backgroundColor: "green",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    saSetNumberWebhook({
                      numberId: p.id,
                      webhookName: "Voxd Production",
                    })
                  }
                >
                  Set webhook to Voxd
                </button>
                <button
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    saSetNumberWebhook({
                      numberId: p.id,
                      webhookName: "Voxd Development",
                    })
                  }
                >
                  Set webhook to Voxd Development
                </button>
                <button
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    saClearNumberWebhook({
                      numberId: p.id,
                    })
                  }
                >
                  Clear webhook
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <code className="whitespace-pre-wrap text-xs opacity-80">
        {JSON.stringify(waba, null, 2)}
      </code>
    </div>
  );
}
