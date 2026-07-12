export interface User {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

export interface Chat {
    id: number;
    type: "private" | "group" | "supergroup" | "channel";
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
}

export interface Message {
    message_id: number;
    from?: User;
    chat: Chat;
    date: number;
    text?: string;
}

export interface CallbackQuery {
    id: string;
    from: User;
    message?: Message;
    data?: string;
}

export interface Update {
    update_id: number;
    message?: Message;
    callback_query?: CallbackQuery;
}

export interface ReplyKeyboardMarkup {
    keyboard: KeyboardButton[][];
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    is_persistent?: boolean;
}

export interface KeyboardButton {
    text: string;
}

export interface InlineKeyboardMarkup {
    inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
    text: string;
    callback_data?: string;
    url?: string;
}