import { create } from "zustand";

interface UIState {
  activeChatRoomId: string | null;
  notificationPanelOpen: boolean;
  setActiveChatRoom: (roomId: string | null) => void;
  setNotificationPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeChatRoomId: null,
  notificationPanelOpen: false,
  setActiveChatRoom: (roomId) => set({ activeChatRoomId: roomId }),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
}));
