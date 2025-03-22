import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { format, isToday, isYesterday } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Conversation {
  id: string;
  participants: {
    id: string;
    email: string;
    full_name: string;
    is_online: boolean;
  }[];
  lastMessage: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  } | null;
}

interface ConversationListProps {
  activeConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

export default function ConversationList({
  activeConversationId,
  onConversationSelect,
  onNewConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchConversations();
      // Subscribe to new messages
      const subscription = supabase
        .channel("messages-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          () => {
            fetchConversations();
          },
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Get all conversations the current user is part of
      const { data: userConversations, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user?.id);

      if (error) throw error;
      if (!userConversations || userConversations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = userConversations.map((c) => c.conversation_id);

      // Get all participants for these conversations
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", conversationIds);

      if (!participants) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get user details for all participants
      const userIds = [...new Set(participants.map((p) => p.user_id))];
      const { data: userProfiles } = await supabase
        .from("auth.users")
        .select("id, email, raw_user_meta_data")
        .in("id", userIds);

      // Get online status
      const { data: userStatus } = await supabase
        .from("user_status")
        .select("user_id, is_online")
        .in("user_id", userIds);

      // Get last message for each conversation
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("id, conversation_id, user_id, content, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      // Get read status for messages
      const { data: messageStatus } = await supabase
        .from("message_status")
        .select("message_id, user_id, is_read")
        .in("user_id", [user?.id]);

      // Format conversations with participants and last message
      const formattedConversations = conversationIds.map((conversationId) => {
        const conversationParticipants = participants
          .filter(
            (p) =>
              p.conversation_id === conversationId && p.user_id !== user?.id,
          )
          .map((p) => {
            const userProfile = userProfiles?.find((u) => u.id === p.user_id);
            const status = userStatus?.find((s) => s.user_id === p.user_id);
            return {
              id: p.user_id,
              email: userProfile?.email || "",
              full_name: userProfile?.raw_user_meta_data?.full_name || "User",
              is_online: status?.is_online || false,
            };
          });

        const lastMessage = lastMessages?.find(
          (m) => m.conversation_id === conversationId,
        );
        const messageReadStatus = lastMessage
          ? messageStatus?.find((ms) => ms.message_id === lastMessage.id)
          : null;

        return {
          id: conversationId,
          participants: conversationParticipants,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                created_at: lastMessage.created_at,
                is_read: messageReadStatus?.is_read || false,
                sender_id: lastMessage.user_id,
              }
            : null,
        };
      });

      // Sort conversations by last message time (most recent first)
      formattedConversations.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
          new Date(b.lastMessage.created_at).getTime() -
          new Date(a.lastMessage.created_at).getTime()
        );
      });

      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const filteredConversations = conversations.filter((conversation) => {
    const participantNames = conversation.participants
      .map((p) => p.full_name.toLowerCase())
      .join(" ");
    const participantEmails = conversation.participants
      .map((p) => p.email.toLowerCase())
      .join(" ");
    return (
      participantNames.includes(searchQuery.toLowerCase()) ||
      participantEmails.includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Chats</h2>
          <Button
            onClick={onNewConversation}
            className="h-8 w-8 p-0 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            variant="ghost"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-full bg-gray-100 border-0 text-sm focus:ring-2 focus:ring-gray-200 focus-visible:ring-gray-200 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            {searchQuery ? "No conversations found" : "No conversations yet"}
            <div className="mt-2">
              <Button
                onClick={onNewConversation}
                className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100"
                variant="ghost"
              >
                Start a new conversation
              </Button>
            </div>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const otherUser = conversation.participants[0] || {
              full_name: "Unknown",
              email: "",
              is_online: false,
            };
            const isActive = conversation.id === activeConversationId;
            const isUnread =
              conversation.lastMessage &&
              !conversation.lastMessage.is_read &&
              conversation.lastMessage.sender_id !== user?.id;

            return (
              <div
                key={conversation.id}
                className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isActive ? "bg-blue-50" : ""}`}
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.email}`}
                    />
                    <AvatarFallback>{otherUser.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${otherUser.is_online ? "bg-green-500" : "bg-gray-300"} border-2 border-white`}
                  ></span>
                </div>
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm truncate text-gray-900">
                      {otherUser.full_name}
                    </h4>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(conversation.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <p
                      className={`text-xs truncate ${isUnread ? "text-gray-900 font-medium" : "text-gray-500"}`}
                    >
                      {conversation.lastMessage
                        ? conversation.lastMessage.sender_id === user?.id
                          ? `You: ${conversation.lastMessage.content}`
                          : conversation.lastMessage.content
                        : "Start a conversation"}
                    </p>
                    {isUnread && (
                      <span className="ml-2 h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
