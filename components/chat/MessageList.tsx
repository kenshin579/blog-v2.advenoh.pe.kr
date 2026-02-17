"use client";

import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SourceLinks } from "./SourceLinks";
import { sendFeedback } from "@/lib/chat-api";
import type { SourceDocument } from "@/lib/chat-api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceDocument[];
  message_id?: string;
  question?: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  blogId: string;
}

type FeedbackState = "idle" | "sending" | "done";

export function MessageList({ messages, isLoading, blogId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [feedbackMap, setFeedbackMap] = useState<
    Record<string, { state: FeedbackState; rating?: "up" | "down" }>
  >({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFeedback = async (
    messageId: string,
    question: string,
    rating: "up" | "down"
  ) => {
    setFeedbackMap((prev) => ({
      ...prev,
      [messageId]: { state: "sending", rating },
    }));
    try {
      await sendFeedback({ message_id: messageId, blog_id: blogId, question, rating });
      setFeedbackMap((prev) => ({
        ...prev,
        [messageId]: { state: "done", rating },
      }));
    } catch {
      setFeedbackMap((prev) => ({
        ...prev,
        [messageId]: { state: "idle" },
      }));
    }
  };

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-4 py-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Bot className="mb-3 h-10 w-10" />
            <p className="text-sm font-medium">블로그에 대해 궁금한 것을 물어보세요!</p>
            <p className="mt-1 text-xs">예: &quot;Go 관련 글이 있나요?&quot;</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "assistant" && msg.sources && (
                <SourceLinks sources={msg.sources} />
              )}
              {msg.role === "assistant" && msg.message_id && msg.question && (() => {
                const fb = feedbackMap[msg.message_id] ?? { state: "idle" };
                const isSending = fb.state === "sending";
                const isDone = fb.state === "done";
                return (
                  <div className="mt-2 flex items-center gap-2 border-t border-border/50 pt-2">
                    {isDone ? (
                      <span className="text-xs text-muted-foreground">
                        피드백 감사합니다 {fb.rating === "up" ? "👍" : "👎"}
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground">도움이 됐나요?</span>
                        <button
                          onClick={() => handleFeedback(msg.message_id!, msg.question!, "up")}
                          disabled={isSending}
                          className="text-sm disabled:opacity-40 hover:scale-110 transition-transform"
                          aria-label="좋아요"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.message_id!, msg.question!, "down")}
                          disabled={isSending}
                          className="text-sm disabled:opacity-40 hover:scale-110 transition-transform"
                          aria-label="별로예요"
                        >
                          👎
                        </button>
                        {isSending && (
                          <span className="text-xs text-muted-foreground animate-pulse">전송 중...</span>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
