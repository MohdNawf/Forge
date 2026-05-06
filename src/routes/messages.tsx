import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../lib/AuthContext";

export default function MessagesRoute() {
  const { user } = useAuth();
  const chats = useQuery(api.messages.listMyProjectChats) ?? [];
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [draft, setDraft] = useState("");
  const sendMessage = useMutation(api.messages.sendProjectMessage);

  useEffect(() => {
    if (!selectedProjectId && chats.length > 0) {
      setSelectedProjectId(chats[0].projectId);
    }
    if (
      selectedProjectId &&
      chats.length > 0 &&
      !chats.some((chat) => chat.projectId === selectedProjectId)
    ) {
      setSelectedProjectId(chats[0].projectId);
    }
  }, [chats, selectedProjectId]);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.projectId === selectedProjectId) ?? null,
    [chats, selectedProjectId]
  );

  const messages = useQuery(
    api.messages.getProjectMessages,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  const handleSend = async () => {
    if (!selectedProjectId || !draft.trim()) return;
    await sendMessage({ projectId: selectedProjectId, body: draft.trim() });
    setDraft("");
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-8 md:px-10">
      <div className="border border-rule bg-paper">
        <div className="grid min-h-[72vh] md:grid-cols-[320px_1fr]">
          <aside className="border-b border-rule p-4 md:border-b-0 md:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/70">
              § Conversations
            </p>
            <h1 className="mt-2 text-4xl">Inbox</h1>

            {chats.length === 0 ? (
              <p className="mt-6 max-w-[240px] text-sm text-ink/70">
                No chats yet. Post or join a project, then accepted members can talk in the
                project group.
              </p>
            ) : (
              <ul className="mt-6 space-y-2">
                {chats.map((chat) => (
                  <li key={chat.projectId}>
                    <button
                      onClick={() => setSelectedProjectId(chat.projectId)}
                      className={`w-full border px-3 py-2 text-left transition ${
                        selectedProjectId === chat.projectId
                          ? "border-ink bg-ink text-paper"
                          : "border-rule hover:border-ink/40"
                      }`}
                    >
                      <p className="font-medium">{chat.projectTitle}</p>
                      <p
                        className={`mt-1 text-xs ${
                          selectedProjectId === chat.projectId ? "text-paper/80" : "text-ink/60"
                        }`}
                      >
                        {chat.lastMessage || "No messages yet."}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="flex min-h-[420px] flex-col">
            {!selectedChat ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-ink/70">
                Pick a conversation to start chatting.
              </div>
            ) : (
              <>
                <header className="border-b border-rule px-5 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/70">
                    Project Group
                  </p>
                  <h2 className="mt-1 text-3xl">{selectedChat.projectTitle}</h2>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {(messages ?? []).length === 0 ? (
                    <p className="text-sm text-ink/70">
                      No messages yet. Send the first message to this project group.
                    </p>
                  ) : (
                    (messages ?? []).map((message) => {
                      const mine = message.senderId === user?.id;
                      return (
                        <div
                          key={message._id}
                          className={`max-w-[72%] rounded-md border px-3 py-2 ${
                            mine
                              ? "ml-auto border-ink bg-ink text-paper"
                              : "border-rule bg-white text-ink"
                          }`}
                        >
                          <p className="text-xs opacity-75">
                            {mine ? (
                              "You"
                            ) : (
                              <Link
                                to={`/profile/${message.senderId}`}
                                className="underline underline-offset-2 hover:opacity-90"
                              >
                                {message.senderName ?? message.senderId}
                              </Link>
                            )}
                          </p>
                          <p className="mt-1 text-sm">{message.body}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-rule p-4">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    rows={2}
                    placeholder="Write a message..."
                    className="w-full resize-none border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => void handleSend()}
                      className="bg-ink px-4 py-2 text-sm text-paper disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!draft.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
