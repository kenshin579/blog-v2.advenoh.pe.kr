"use client";

import { useCallback, useState } from "react";
import { X, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sendChatMessage } from "@/lib/chat-api";
import { MessageList, type Message } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ChatWindowProps {
  onClose: () => void;
}

export function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<[string, string][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(
    async (question: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await sendChatMessage(question, chatHistory);
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.answer,
          sources: res.sources,
          message_id: res.message_id,
          question,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setChatHistory((prev) => [...prev, [question, res.answer]]);
      } catch {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [chatHistory]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-20 right-6 z-50 w-[calc(100vw-3rem)] max-w-[400px] md:w-[400px]"
    >
      <Card className="flex h-[500px] max-h-[70vh] flex-col overflow-hidden shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">블로그 Q&A</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
            aria-label="채팅 닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <MessageList messages={messages} isLoading={isLoading} blogId="blog-v2" />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </Card>
    </motion.div>
  );
}
