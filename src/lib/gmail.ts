import { GmailMessage } from '../types';

export const listEmails = async (accessToken: string): Promise<GmailMessage[]> => {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  
  if (!data.messages) return [];

  const messages = await Promise.all(
    data.messages.map(async (msg: any) => {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const detail = await detailRes.json();
      
      const headers = detail.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value;
      const from = headers.find((h: any) => h.name === 'From')?.value;
      const date = headers.find((h: any) => h.name === 'Date')?.value;

      return {
        id: detail.id,
        threadId: detail.threadId,
        subject,
        from,
        date,
        snippet: detail.snippet,
      };
    })
  );

  return messages;
};

export const sendEmail = async (accessToken: string, to: string, subject: string, body: string) => {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    body,
  ];
  const message = messageParts.join('\n');

  // The message needs to be base64url encoded.
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  return await response.json();
};
