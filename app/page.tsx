"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Plus, Mic } from "lucide-react";
import chatData from "./data/chatMessages.json";

type Participant = {
  id: string;
  name: string;
  isSelf?: boolean;
  avatar?: string;
};

type BaseMessage = {
  senderId: string;
  typingDelayMs?: number;
};

type TextMessage = BaseMessage & {
  type: "text";
  text: string;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, ms);
  });

const participantMap = new Map<string, Participant>(
  (chatData.participants as Participant[]).map((participant) => [
    participant.id,
    participant,
  ])
);

function participantLookup(id?: string) {
  if (!id) return undefined;
  return participantMap.get(id);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-600",
    "bg-green-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-indigo-600",
    "bg-orange-600",
    "bg-teal-600",
    "bg-red-600",
    "bg-yellow-600",
    "bg-cyan-600",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function MessageBubble({
  participant,
  message,
  showAvatar,
}: {
  participant: Participant | undefined;
  message: TextMessage;
  showAvatar: boolean;
}) {
  const isSelf = participant?.isSelf;

  return (
    <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
      {showAvatar && (
        <span
          className={`mb-1 text-[13px] font-medium text-gray-400 ${
            isSelf ? "mr-1" : "ml-1"
          }`}
        >
          {participant?.name}
        </span>
      )}
      <div
        className={`
          px-3.5 py-2.5 rounded-[18px] transition-shadow relative
          ${
            isSelf
              ? "bg-[#0B84FF] text-white shadow-lg"
              : "bg-[#3A3A3C] text-white shadow-md"
          }
        `}
      >
        <p className="text-[15px] leading-[1.35] wrap-break-word whitespace-pre-line">
          {message.text}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const messages = useMemo(() => {
    return chatData.messages as TextMessage[];
  }, []);

  const [displayedMessages, setDisplayedMessages] = useState<TextMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingSender, setCurrentTypingSender] = useState("");
  const [currentTypingAvatar, setCurrentTypingAvatar] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const showNextMessage = () => {
      if (currentIndex < messages.length) {
        const nextMessage = messages[currentIndex];
        const participant = participantLookup(nextMessage.senderId);

        if (participant?.isSelf) {
          setDisplayedMessages((prev) => [...prev, nextMessage]);
          currentIndex++;
          timeoutId = setTimeout(() => {
            showNextMessage();
          }, 500);
        } else {
          setIsTyping(true);
          setCurrentTypingSender(participant?.name || "");
          setCurrentTypingAvatar(getInitials(participant?.name || ""));

          const delay =
            nextMessage.typingDelayMs ?? chatData.defaultTypingDelayMs ?? 2000;

          timeoutId = setTimeout(() => {
            setIsTyping(false);
            setDisplayedMessages((prev) => [...prev, nextMessage]);
            currentIndex++;
            timeoutId = setTimeout(() => {
              showNextMessage();
            }, 500);
          }, delay);
        }
      }
    };

    timeoutId = setTimeout(() => {
      showNextMessage();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden select-none">
      {/* Gradient overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-20" />

      {/* Header with transparent background */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-30 px-2 pt-3"
      >
        {/* Group info */}
        <div className="flex flex-col items-center pb-3 relative">
          {/* Video call button */}
          <button className="absolute top-0 right-0 w-9 h-9 rounded-full bg-gray-800/80 flex items-center justify-center backdrop-blur-md hover-elevate active-elevate-2">
            <Video className="w-5 h-5 text-white" />
          </button>

          {/* Cake emoji avatar */}
          <div className="w-16 h-16 rounded-full bg-pink-400 flex items-center justify-center text-3xl mb-2 shadow-lg">
            🎂
          </div>

          {/* Group name badge */}
          <div className="bg-gray-800/90 backdrop-blur-md px-4 py-1.5 rounded-full">
            <h1 className="text-white text-[15px] font-semibold tracking-tight">
              {chatData.chatTitle}
            </h1>
          </div>
        </div>
      </motion.header>

      {/* Messages container */}
      <main
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 pt-4 pb-12 ios-scroll"
        style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
      >
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="popLayout">
            {displayedMessages.map((message, index) => {
              const participant = participantLookup(message.senderId);
              const showAvatar =
                index === 0 ||
                displayedMessages[index - 1]?.senderId !== message.senderId;

              return (
                <motion.div
                  key={`message-${index}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={`mb-2 flex items-end gap-2 ${
                    participant?.isSelf ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar for non-user messages - always shown */}
                  {!participant?.isSelf && (
                    <div
                      className={`w-7 h-7 rounded-full ${getAvatarColor(
                        participant?.name || ""
                      )} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}
                    >
                      {getInitials(participant?.name || "")}
                    </div>
                  )}

                  <div
                    className={`flex flex-col ${
                      participant?.isSelf ? "items-end" : "items-start"
                    } max-w-[75%] sm:max-w-[65%]`}
                  >
                    <MessageBubble
                      participant={participant}
                      message={message}
                      showAvatar={showAvatar}
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mb-2 flex items-end gap-2 justify-start"
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full ${getAvatarColor(
                    currentTypingSender
                  )} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}
                >
                  {currentTypingAvatar}
                </div>

                <div className="flex flex-col items-start max-w-[75%]">
                  <span className="text-[13px] font-medium text-gray-400 mb-1 px-1">
                    {currentTypingSender}
                  </span>
                  <div className="bg-[#3A3A3C] px-4 py-3 rounded-[18px] message-bubble-tail-left flex items-center gap-1 shadow-md">
                    <div
                      className="typing-dot-dark"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="typing-dot-dark"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="typing-dot-dark"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom input bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-gray-800/50 px-2 py-2 safe-area-bottom z-30">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <button className="w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center hover-elevate active-elevate-2 shrink-0">
            <Plus className="w-5 h-5 text-white" />
          </button>

          <div className="flex-1 bg-[#1C1C1E] rounded-[18px] px-4 py-1 flex items-center min-h-[36px]">
            <input
              type="text"
              placeholder="iMessage"
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-[16px] outline-none"
              disabled
            />
          </div>

          <button className="w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center hover-elevate active-elevate-2 shrink-0">
            <Mic className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
