import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Smile,
  Paperclip,
  Send,
  Phone,
  Video,
  Info,
  Mic,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { format } from "date-fns";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  is_read: boolean;
  message_type?: "text" | "image" | "file" | "voice";
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

interface Participant {
  id: string;
  email: string;
  full_name: string;
  is_online: boolean;
  is_typing?: boolean;
}

interface ChatAreaProps {
  conversationId: string | null;
}

export default function ChatArea({ conversationId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversationId && user) {
      fetchMessages();
      fetchParticipants();
      markMessagesAsRead();

      // Subscribe to new messages
      const messagesSubscription = supabase
        .channel(`messages-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages((prev) => [...prev, newMessage]);
            if (newMessage.user_id !== user?.id) {
              markMessageAsRead(newMessage.id);
            }
          },
        )
        .subscribe();

      // Subscribe to typing indicators
      const typingSubscription = supabase
        .channel(`typing-${conversationId}`)
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload.user_id !== user?.id) {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === payload.user_id
                  ? { ...p, is_typing: payload.is_typing }
                  : p,
              ),
            );
          }
        })
        .subscribe();

      return () => {
        messagesSubscription.unsubscribe();
        typingSubscription.unsubscribe();
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Get read status for messages
      const { data: messageStatus, error: statusError } = await supabase
        .from("message_status")
        .select("message_id, is_read")
        .eq("user_id", user.id);

      if (statusError) {
        console.error("Error fetching message status:", statusError);
      }

      const messagesWithReadStatus = data.map((message) => ({
        ...message,
        is_read:
          messageStatus?.find((ms) => ms.message_id === message.id)?.is_read ||
          false,
      }));

      setMessages(messagesWithReadStatus);
    } catch (error) {
      console.error("Error in fetchMessages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!conversationId || !user) return;

    try {
      const { data: participantData, error } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId);

      if (error) {
        console.error("Error fetching participants:", error);
        return;
      }

      if (!participantData || participantData.length === 0) {
        setParticipants([]);
        return;
      }

      const userIds = participantData
        .map((p) => p.user_id)
        .filter((id) => id !== user.id);

      if (userIds.length === 0) {
        setParticipants([]);
        return;
      }

      // Try to get user data from users table first
      const { data: userProfiles, error: profilesError } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      if (profilesError || !userProfiles || userProfiles.length === 0) {
        // Fallback to auth.users if users table fails
        const { data: authUsers, error: authError } = await supabase
          .from("auth.users")
          .select("id, email, raw_user_meta_data")
          .in("id", userIds);

        if (authError) {
          console.error("Error fetching user profiles:", authError);
          return;
        }

        const { data: userStatus } = await supabase
          .from("user_status")
          .select("user_id, is_online")
          .in("user_id", userIds);

        const formattedParticipants =
          authUsers?.map((profile) => {
            const status = userStatus?.find((s) => s.user_id === profile.id);
            return {
              id: profile.id,
              email: profile.email,
              full_name: profile.raw_user_meta_data?.full_name || "User",
              is_online: status?.is_online || false,
              is_typing: false,
            };
          }) || [];

        setParticipants(formattedParticipants);
        return;
      }

      // If we have user profiles from the users table
      const { data: userStatus } = await supabase
        .from("user_status")
        .select("user_id, is_online")
        .in("user_id", userIds);

      const formattedParticipants = userProfiles.map((profile) => {
        const status = userStatus?.find((s) => s.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          is_online: status?.is_online || false,
          is_typing: false,
        };
      });

      setParticipants(formattedParticipants);
    } catch (error) {
      console.error("Error in fetchParticipants:", error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversationId || !user) return;

    try {
      // Get all messages in this conversation not sent by current user
      const { data: unreadMessages, error: messagesError } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id);

      if (messagesError) {
        console.error("Error fetching unread messages:", messagesError);
        return;
      }

      if (!unreadMessages || unreadMessages.length === 0) return;

      // Check which messages already have status records
      const messageIds = unreadMessages.map((m) => m.id);
      const { data: existingStatus, error: statusError } = await supabase
        .from("message_status")
        .select("message_id")
        .eq("user_id", user.id)
        .in("message_id", messageIds);

      if (statusError) {
        console.error("Error fetching message status:", statusError);
        return;
      }

      const existingMessageIds = existingStatus?.map((s) => s.message_id) || [];

      // Create status records for messages that don't have them
      const newStatusRecords = messageIds
        .filter((id) => !existingMessageIds.includes(id))
        .map((id) => ({
          message_id: id,
          user_id: user.id,
          is_delivered: true,
          is_read: true,
          delivered_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
        }));

      if (newStatusRecords.length > 0) {
        const { error: insertError } = await supabase
          .from("message_status")
          .insert(newStatusRecords);

        if (insertError) {
          console.error("Error inserting message status:", insertError);
        }
      }

      // Update existing status records
      if (existingMessageIds.length > 0) {
        const { error: updateError } = await supabase
          .from("message_status")
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .in("message_id", existingMessageIds);

        if (updateError) {
          console.error("Error updating message status:", updateError);
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      const { data: existingStatus, error: statusError } = await supabase
        .from("message_status")
        .select("id")
        .eq("user_id", user.id)
        .eq("message_id", messageId);

      if (statusError) {
        console.error("Error checking message status:", statusError);
        return;
      }

      if (existingStatus && existingStatus.length > 0) {
        const { error: updateError } = await supabase
          .from("message_status")
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq("id", existingStatus[0].id);

        if (updateError) {
          console.error("Error updating message status:", updateError);
        }
      } else {
        const { error: insertError } = await supabase
          .from("message_status")
          .insert({
            message_id: messageId,
            user_id: user.id,
            is_delivered: true,
            is_read: true,
            delivered_at: new Date().toISOString(),
            read_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("Error inserting message status:", insertError);
        }
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleSendMessage = async (
    messageType: "text" | "image" | "file" | "voice" = "text",
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
  ) => {
    if (
      (!newMessage.trim() && messageType === "text") ||
      !conversationId ||
      !user
    )
      return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          content:
            messageType === "text"
              ? newMessage.trim()
              : messageType === "voice"
                ? "Voice message"
                : messageType === "image"
                  ? "Image"
                  : `File: ${fileName}`,
          message_type: messageType,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
        })
        .select();

      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.error("No data returned after sending message");
        return;
      }

      // Create message status for sender (delivered and read)
      const { error: statusError } = await supabase
        .from("message_status")
        .insert({
          message_id: data[0].id,
          user_id: user.id,
          is_delivered: true,
          is_read: true,
          delivered_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
        });

      if (statusError) {
        console.error("Error creating message status for sender:", statusError);
      }

      // Create message status for other participants (delivered but not read)
      if (participants.length > 0) {
        const otherParticipants = participants.map((p) => ({
          message_id: data[0].id,
          user_id: p.id,
          is_delivered: true,
          is_read: false,
          delivered_at: new Date().toISOString(),
        }));

        const { error: participantsStatusError } = await supabase
          .from("message_status")
          .insert(otherParticipants);

        if (participantsStatusError) {
          console.error(
            "Error creating message status for participants:",
            participantsStatusError,
          );
        }
      }

      setNewMessage("");
      // Stop typing indicator when message is sent
      handleTypingStop();
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.onstart = () => {
        setAudioChunks([]);
        setIsRecording(true);
      };

      recorder.ondataavailable = (e) => {
        setAudioChunks((chunks) => [...chunks, e.data]);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        // Upload to Supabase Storage
        const fileName = `voice-message-${Date.now()}.webm`;
        const filePath = `voice-messages/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(filePath, audioBlob);

        if (uploadError) {
          console.error("Error uploading voice message:", uploadError);
          return;
        }

        // Get public URL
        const { data } = supabase.storage
          .from("message-attachments")
          .getPublicUrl(filePath);

        // Send voice message
        await handleSendMessage(
          "voice",
          data.publicUrl,
          fileName,
          audioBlob.size,
        );

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !conversationId || !user)
      return;

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `attachments/${fileName}`;

    try {
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from("message-attachments")
        .getPublicUrl(filePath);

      // Determine if it's an image or other file
      const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
        fileExt || "",
      );

      // Send message with attachment
      await handleSendMessage(
        isImage ? "image" : "file",
        data.publicUrl,
        file.name,
        file.size,
      );

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error in handleFileUpload:", error);
    }
  };

  const handleTypingStart = () => {
    if (!conversationId || typing) return;

    setTyping(true);
    supabase.channel(`typing-${conversationId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user?.id, is_typing: true },
    });

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout
    typingTimeoutRef.current = setTimeout(handleTypingStop, 3000);
  };

  const handleTypingStop = () => {
    if (!conversationId || !typing) return;

    setTyping(false);
    supabase.channel(`typing-${conversationId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user?.id, is_typing: false },
    });

    // Clear the timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), "h:mm a");
  };

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900">
              <Send className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2 dark:text-gray-300">
            Your Messages
          </h3>
          <p className="max-w-md mx-auto">
            Select a conversation or start a new one to begin messaging
          </p>
        </div>
      </div>
    );
  }

  const otherUser = participants[0] || {
    full_name: "User",
    email: "",
    is_online: false,
    is_typing: false,
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Chat header */}
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.email}`}
            />
            <AvatarFallback>{otherUser.full_name[0]}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {otherUser.full_name}
            </h3>
            <p className="text-xs text-green-500 dark:text-green-400">
              {otherUser.is_typing
                ? "Typing..."
                : otherUser.is_online
                  ? "Online"
                  : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <Phone className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            onClick={() => setShowVideoCall(true)}
          >
            <Video className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <Info className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin dark:border-gray-700"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <p>No messages yet</p>
              <p className="text-sm mt-1">
                Send a message to start the conversation
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.user_id === user?.id;
              const showAvatar =
                index === 0 || messages[index - 1].user_id !== message.user_id;

              return (
                <div
                  key={message.id}
                  className={`flex items-end ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  {!isCurrentUser && showAvatar && (
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.email}`}
                      />
                      <AvatarFallback>{otherUser.full_name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  {!isCurrentUser && !showAvatar && (
                    <div className="w-8 mr-2" />
                  )}
                  <div
                    className={`${
                      isCurrentUser
                        ? "bg-blue-600 text-white rounded-lg rounded-br-none"
                        : "bg-white dark:bg-gray-800 dark:text-white rounded-lg rounded-bl-none"
                    } 
                      p-3 max-w-xs shadow-sm`}
                  >
                    {message.message_type === "image" ? (
                      <div className="mb-1">
                        <img
                          src={message.file_url}
                          alt="Image"
                          className="rounded-md max-w-full max-h-48 object-contain"
                          loading="lazy"
                        />
                      </div>
                    ) : message.message_type === "file" ? (
                      <div className="flex items-center space-x-2 mb-1">
                        <File className="h-5 w-5" />
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline truncate max-w-[180px]"
                        >
                          {message.file_name}
                        </a>
                      </div>
                    ) : message.message_type === "voice" ? (
                      <div className="mb-1">
                        <audio controls className="w-full max-w-[200px]">
                          <source src={message.file_url} type="audio/webm" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                    <div
                      className={`flex items-center mt-1 space-x-1 ${isCurrentUser ? "justify-end" : ""}`}
                    >
                      <span
                        className={`text-xs ${isCurrentUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}
                      >
                        {formatMessageTime(message.created_at)}
                      </span>
                      {isCurrentUser && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-blue-100"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {otherUser.is_typing && (
              <div className="flex items-end">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.email}`}
                  />
                  <AvatarFallback>{otherUser.full_name[0]}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-200 rounded-full px-4 py-2 dark:bg-gray-700">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce dark:bg-gray-400"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-100 dark:bg-gray-400"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-200 dark:bg-gray-400"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="p-3 border-t border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex space-x-1 mr-2">
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Smile className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none" align="start">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme={
                    document.documentElement.classList.contains("dark")
                      ? "dark"
                      : "light"
                  }
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              <Mic
                className={`h-5 w-5 ${isRecording ? "text-red-500 animate-pulse" : "text-gray-600 dark:text-gray-300"}`}
              />
            </Button>
          </div>
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTypingStart();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-700"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!newMessage.trim()}
            className="ml-2 h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Video Call Dialog */}
      <Dialog open={showVideoCall} onOpenChange={setShowVideoCall}>
        <DialogContent className="sm:max-w-md dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Video Call</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-md">
            <Video className="h-12 w-12 text-gray-400 mb-4 dark:text-gray-300" />
            <p className="text-center text-gray-500 dark:text-gray-400">
              Video calling functionality will be implemented with a third-party
              service like Twilio or WebRTC.
            </p>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <Button
              variant="destructive"
              onClick={() => setShowVideoCall(false)}
            >
              End Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
