import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.KAPSO_API_KEY || process.env.VITE_KAPSO_API_KEY;
    const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID || process.env.VITE_KAPSO_PHONE_NUMBER_ID;

    if (!apiKey || !phoneNumberId) {
      return res.status(500).json({ error: 'Faltan las credenciales de Kapso en el servidor' });
    }

    const whatsapp = new WhatsAppClient({
      baseUrl: "https://api.kapso.ai/meta/whatsapp",
      kapsoApiKey: apiKey
    });

    const contacts = await whatsapp.contacts.list({
      phoneNumberId: phoneNumberId,
      limit: 100,
      fields: "contact_name" as any
    });

    const formattedContacts = (contacts.data || []).map((contact: any) => ({
      id: contact.waId || contact.id, // we prefer waId which is the phone
      phone: contact.waId,
      name: contact.profileName || contact.contactName || contact.waId,
      isKapso: true // Flag to identify them in frontend
    }));

    return res.status(200).json(formattedContacts);

  } catch (error: any) {
    console.error('Error fetching Kapso contacts:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
