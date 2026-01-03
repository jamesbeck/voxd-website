Voxd provides WhatsApp based chatbot services.

We use the Meta API add a webhook to WhatsApp for Business Accounts (WABAs).
Voxd saves incoming messages into our database where they are queued for processing.
Voxd processes each message by sending it to our chosen LLM provider and model (our service supports any). The incoming message is sent along with a detailed prompt specific to that agent. This includes:

- A agent specific prompt
- Conversation history
- User data and history (e.g. name, previous orders, etc)
- Any other relevant information from external applications (user account details, address, etc)
- Tools that give the LLM realtime access to external systems (CRM and other back office systems)
- Tools that give the LLM access to unlimited knowledge documents (polices, faq, general information, product lists, menus, etc)
  A reply is generated, saved in the Voxd database, and sent back to the user via the Meta Graph API. If the user replies, the process begins again.
  Separately, we run 'workers'. Workers are separate scripts, normally AI based, but not necessarily, that monitor the conversation and performance actions outside of the message reply mechanism. For example, you could monitor the sentiment of the conversation and notify a customer services rep if the user is unhappy. You could decide send the users details to the sales team if they are sufficiently interested in your products or services. These workers can be scheduled, so that they run on a specific amount of time after the conversation has finished and can be setup to reply to the user too, this makes them useful to continue conversation that have gone quiet, or provide the user with an order update, etc.
  The Voxd system can also send outbound messages to users. If the user has not been messaged before these messages must be templates, pre-approved by Meta. If the user has sent a message to the agent with the last 24 hours, these messages can be free form. Meta charge for 'cold' messages to be sent but any within the reply window are free.
