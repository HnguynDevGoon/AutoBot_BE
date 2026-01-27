import * as signalR from "@microsoft/signalr";

export const createChatConnection = (guestId: string, isGuest: boolean) => {
    const url = `${process.env.NEXT_PUBLIC_URL_API_HUB}/chatHub?${!isGuest ? 'targetId' : 'guestId'}=${guestId}`;
    return new signalR.HubConnectionBuilder()
        .withUrl(url)
        .withAutomaticReconnect()
        .build();
};

export const createChatConnectionAdmin = (guestId: string, isGuest: boolean) => {
    const url = `${process.env.NEXT_PUBLIC_URL_API_HUB}/chatHub?${!isGuest ? 'targetId' : 'guestId'}=${guestId}`;
    return new signalR.HubConnectionBuilder()
        .withUrl(url)
        .withAutomaticReconnect()
        .build();
};


export const createChatConnectionRoom = (roomId: string, isGuest: boolean) => {
    const query = isGuest
        ? `?guestId=${roomId}`     // nếu là guest
        : `?targetId=${roomId}`;  // nếu là user đã login

    const url = `${process.env.NEXT_PUBLIC_URL_API_HUB}/chatHub${query}`;

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(url)
        .withAutomaticReconnect()
        .build();

    return connection;
};