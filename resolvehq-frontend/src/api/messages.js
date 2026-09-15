import api from "./axios";

export function replyToTicket(ticketId, messages) {
  return api.post(`/response/replyMessage/${ticketId}`, { messages });
}

// NOTE: backend response shape here is { message: [...] } — the key is
// singular "message" but the value is an array of message rows. Not a typo
// on our end, that's just how this endpoint replies.
export function getMessages(ticketId) {
  return api.get(`/response/allMessages/${ticketId}`);
}
