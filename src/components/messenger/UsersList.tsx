import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle } from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_online?: boolean;
  last_active?: string;
  avatar_url?: string;
  status?: string;
  is_blocked?: boolean;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchBlockedUsers();
      fetchUsers();

      // Set up a timer to retry fetching users if the list is empty
      const timer = setTimeout(() => {
        if (users.length === 0 && !loading) {
          console.log("Retrying user fetch...");
          fetchUsers();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const fetchBlockedUsers = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("blocked_user_id")
        .eq("user_id", currentUser.id);

      if (error) throw error;

      if (data) {
        setBlockedUsers(data.map((item) => item.blocked_user_id));
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    }
  };

  const fetchUsers = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log("Fetching users...");

      // First try to get users from the public users table
      const { data: authUsers, error } = await supabase
        .from("users")
        .select("id, email, full_name")
        .neq("id", currentUser?.id || "");

      if (error || !authUsers || authUsers.length === 0) {
        console.log("Falling back to auth.users table");
        // Try fallback to auth.users if users table fails or is empty
        const { data: fallbackUsers, error: fallbackError } = await supabase
          .from("auth.users")
          .select("id, email, raw_user_meta_data")
          .neq("id", currentUser?.id || "");

        if (fallbackError) {
          console.error("Error fetching from auth.users:", fallbackError);
          setUsers([]);
          setLoading(false);
          return;
        }

        if (!fallbackUsers || fallbackUsers.length === 0) {
          console.log("No users found in auth.users");
          setUsers([]);
          setLoading(false);
          return;
        }

        // Format users from auth.users
        const formattedFallbackUsers = fallbackUsers.map((user) => ({
          id: user.id,
          email: user.email,
          full_name: user.raw_user_meta_data?.full_name || "User",
          is_blocked: blockedUsers.includes(user.id),
        }));

        console.log(
          `Found ${formattedFallbackUsers.length} users from auth.users`,
        );
        setUsers(formattedFallbackUsers);
        setLoading(false);
        return;
      }

      console.log(`Found ${authUsers.length} users from users table`);

      // Get online status for each user
      const { data: userStatus } = await supabase
        .from("user_status")
        .select("user_id, is_online, last_active, status");

      // Get user profiles for avatars
      const { data: userProfiles } = await supabase
        .from("user_profiles")
        .select("user_id, avatar_url");

      const formattedUsers = authUsers.map((authUser) => {
        const status = userStatus?.find(
          (status) => status.user_id === authUser.id,
        );
        const profile = userProfiles?.find(
          (profile) => profile.user_id === authUser.id,
        );
        return {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.full_name || "User",
          is_online: status?.is_online || false,
          last_active: status?.last_active,
          status: status?.status,
          avatar_url: profile?.avatar_url,
          is_blocked: blockedUsers.includes(authUser.id),
        };
      });

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockUser = async (
    userId: string,
    isCurrentlyBlocked: boolean,
  ) => {
    if (!currentUser) return;

    try {
      if (isCurrentlyBlocked) {
        // Unblock user
        await supabase
          .from("blocked_users")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("blocked_user_id", userId);

        toast({
          title: "User unblocked",
          description: "You can now message this user again",
          duration: 3000,
        });
      } else {
        // Block user
        await supabase.from("blocked_users").insert({
          user_id: currentUser.id,
          blocked_user_id: userId,
          created_at: new Date().toISOString(),
        });

        toast({
          title: "User blocked",
          description: "You will no longer receive messages from this user",
          duration: 3000,
        });
      }

      // Update local state
      if (isCurrentlyBlocked) {
        setBlockedUsers(blockedUsers.filter((id) => id !== userId));
      } else {
        setBlockedUsers([...blockedUsers, userId]);
      }

      // Update users list
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return { ...user, is_blocked: !isCurrentlyBlocked };
          }
          return user;
        }),
      );
    } catch (error) {
      console.error("Error toggling block status:", error);
      toast({
        title: "Error",
        description: isCurrentlyBlocked
          ? "Could not unblock user"
          : "Could not block user",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const startConversation = async (userId: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to start a conversation",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      toast({
        title: "Starting conversation",
        description: "Please wait...",
        duration: 2000,
      });

      // Check if conversation already exists
      const { data: existingConversations, error: convError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUser.id);

      if (convError) {
        console.error("Error fetching existing conversations:", convError);
        toast({
          title: "Error",
          description: "Could not check existing conversations",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      if (!existingConversations) {
        console.log("No existing conversations found");
        // Create new conversation directly
        createNewConversation(userId);
        return;
      }

      const conversationIds = existingConversations.map(
        (c) => c.conversation_id,
      );

      const { data: existingConversation } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId)
        .in("conversation_id", conversationIds);

      if (existingConversation && existingConversation.length > 0) {
        // Conversation exists, navigate to it
        navigate(
          `/dashboard?conversation=${existingConversation[0].conversation_id}`,
        );
        return;
      }

      // Create new conversation function
      createNewConversation(userId);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Could not start conversation",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const createNewConversation = async (userId: string) => {
    try {
      console.log("Creating new conversation with user:", userId);
      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({})
        .select();

      if (error) {
        console.error("Error creating conversation:", error);
        throw error;
      }

      if (!newConversation || newConversation.length === 0) {
        console.error("No conversation created");
        throw new Error("No conversation created");
      }

      console.log("New conversation created:", newConversation[0].id);

      // Add participants
      const participants = [
        { conversation_id: newConversation[0].id, user_id: currentUser?.id },
        { conversation_id: newConversation[0].id, user_id: userId },
      ];

      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (participantsError) {
        console.error("Error adding participants:", participantsError);
        throw participantsError;
      }

      console.log("Participants added successfully");

      // Navigate to the conversation
      navigate(`/dashboard?conversation=${newConversation[0].id}`);
      toast({
        title: "Conversation started",
        description: "You can now start messaging",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error in createNewConversation:", error);
      toast({
        title: "Error",
        description: "Could not create conversation",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">
          People
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-full bg-gray-100 border-0 text-sm focus:ring-2 focus:ring-gray-200 focus-visible:ring-gray-200 focus-visible:ring-offset-0 dark:bg-gray-700 dark:text-white dark:focus:ring-gray-600"
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin dark:border-gray-600 dark:border-t-blue-400"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? "No users found" : "No users available"}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 dark:hover:bg-gray-700 dark:border-gray-700"
            >
              <div className="flex items-center">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-gray-100 dark:border-gray-600">
                    <AvatarImage
                      src={
                        user.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                      }
                    />
                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${user.is_online ? (user.status === "away" ? "bg-yellow-500" : user.status === "busy" ? "bg-red-500" : "bg-green-500") : "bg-gray-300"} border-2 border-white dark:border-gray-800`}
                  ></span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.full_name}
                    {user.is_blocked && (
                      <span className="ml-2 text-xs text-red-500">
                        (Blocked)
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() =>
                    toggleBlockUser(user.id, user.is_blocked || false)
                  }
                  size="sm"
                  variant="outline"
                  className={`rounded-full h-8 w-8 p-0 ${user.is_blocked ? "bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {user.is_blocked ? (
                      <>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                      </>
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
                      </>
                    )}
                  </svg>
                </Button>
                <Button
                  onClick={() => startConversation(user.id)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8 p-0 dark:bg-blue-700 dark:hover:bg-blue-800"
                  disabled={user.is_blocked}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
