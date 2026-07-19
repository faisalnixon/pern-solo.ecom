// src/types/stream-custom-data.d.ts
import "stream-chat";

declare module "stream-chat" {
  interface CustomChannelData {
    name?: string;
  }

  interface CustomMessageData {
    video_invite?: boolean;
    join_url?: string;
  }
}
