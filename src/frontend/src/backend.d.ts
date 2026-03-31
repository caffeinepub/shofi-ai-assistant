import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface Message {
    id: bigint;
    speaker: string;
    text: string;
    timestamp: bigint;
}

export interface Command {
    trigger: string;
    response: string;
}

export interface Contact {
    name: string;
    phone: string;
}

export interface backendInterface {
    addMessage: (speaker: string, text: string) => Promise<Message>;
    getMessages: (limit: bigint) => Promise<Message[]>;
    clearMessages: () => Promise<void>;
    getCommands: () => Promise<Command[]>;
    addCommand: (trigger: string, response: string) => Promise<void>;
    removeCommand: (trigger: string) => Promise<void>;
    matchCommand: (input: string) => Promise<Option<string>>;
    getContacts: () => Promise<Contact[]>;
    addContact: (name: string, phone: string) => Promise<void>;
    removeContact: (name: string) => Promise<void>;
    getMasterName: () => Promise<string>;
    setMasterName: (name: string) => Promise<void>;
    research: (query: string) => Promise<string>;
}
