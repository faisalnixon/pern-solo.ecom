import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "@clerk/react";
import type { MeResponse, OrderDetail, OrderItem } from "../types/types.js";

export interface OrderDetailOutletContext {
  order: OrderDetail;
  items: OrderItem[];
  paid: boolean;
}
export interface StreamTokenResponse {
  token: string;
  apiKey: string;
  userId: string;
  name: string;
}
export interface VideoInviteResponse{
    ok:boolean;
    joinUrl:string;
}
export interface StreamChannelResponse{
    channelType:string;
    channelId:string;
    streamUserId:string;
}
export function useOrderChatPage() {
  const { id } = useParams();
  const { getToken, isSignedIn } = useAuth();
  const { paid } = useOutletContext<OrderDetailOutletContext>();
  
  const [client, setClient] = useState<StreamChat | null>(null);
  const [error, setError] = useState<string | null>(null);// useState(null) infers the state type as only `null`; use <string | null> when the state may later hold an error message.

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const role = meData?.user?.role;

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiFetch<VideoInviteResponse>(`/api/orders/${id}/video-invite`, { getToken, method: "POST" }),
  });

  useEffect(() => {
    if (!paid || !id) return undefined;

   let chatClient: StreamChat | undefined;

    async function connectOrderChat() {
      await apiFetch<StreamChannelResponse>(`/api/orders/${id}/stream-channel`, {
        method: "POST",
        getToken,
      });

      const token = await apiFetch<StreamTokenResponse>("/api/stream/token", {
        getToken,
        method: "POST",
      });

      chatClient = StreamChat.getInstance(token.apiKey);

      await chatClient.connectUser(
        { id: token.userId, name: token.name },
        token.token,
      );

      const channel = chatClient.channel("messaging", `order-${id}`);

      await channel.watch();
      setClient(chatClient);
    }

    connectOrderChat().catch((e) => {
      setError(e instanceof Error ? e.message : "Chat failed to load");
    });

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [paid, id, getToken]);

  const channel =
    client && id ? client.channel("messaging", `order-${id}`) : null;
  const canInvite = role === "support" || role === "admin";

  return { paid, client, error, channel, canInvite, inviteMutation };
}
