import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bell,
  Home,
  MessageCircle,
  Search,
  Settings,
  User,
  Moon,
  Sun,
  Upload,
  UserCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../../supabase/supabase";
import { useTheme } from "../../../App";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
}

interface Notification {
  id: string;
  title: string;
  message_id?: string;
  conversation_id?: string;
  created_at: string;
}

type UserStatus = "online" | "away" | "busy" | "invisible";

const TopNavigation = ({ onSearch = () => {} }: TopNavigationProps) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus>("online");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUserProfile();
      fetchUserStatus();

      // Subscribe to new messages
      const subscription = supabase
        .channel("messages-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const newMessage = payload.new as any;
            if (newMessage.user_id !== user.id) {
              fetchNotifications();
            }
          },
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user profile:", error);
        return;
      }

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchUserStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_status")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user status:", error);
        return;
      }

      if (data?.status) {
        setUserStatus(data.status as UserStatus);
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  };

  const updateUserStatus = async (status: UserStatus) => {
    if (!user) return;

    try {
      const { data: existingStatus } = await supabase
        .from("user_status")
        .select("id")
        .eq("user_id", user.id);

      if (existingStatus && existingStatus.length > 0) {
        // Update existing status
        await supabase
          .from("user_status")
          .update({
            status,
            is_online: status !== "invisible",
            last_active: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        // Create new status
        await supabase.from("user_status").insert({
          user_id: user.id,
          status,
          is_online: status !== "invisible",
          last_active: new Date().toISOString(),
        });
      }

      setUserStatus(status);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

    try {
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("user-avatars")
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      // Update user profile
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id);

      if (existingProfile && existingProfile.length > 0) {
        await supabase
          .from("user_profiles")
          .update({ avatar_url: avatarUrl })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_profiles")
          .insert({ user_id: user.id, avatar_url: avatarUrl });
      }

      setAvatarUrl(avatarUrl);
      setShowProfileDialog(false);
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Get unread messages
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select(
          `
          id, 
          content, 
          conversation_id, 
          user_id, 
          created_at,
          conversation_participants!inner(user_id)
        `,
        )
        .eq("conversation_participants.user_id", user.id)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!unreadMessages) return;

      // Get message status to filter out read messages
      const { data: messageStatus } = await supabase
        .from("message_status")
        .select("*")
        .in(
          "message_id",
          unreadMessages.map((msg) => msg.id),
        );

      // Convert to notifications format
      const notifs = unreadMessages.map((msg) => ({
        id: msg.id,
        title: "New message",
        message_id: msg.id,
        conversation_id: msg.conversation_id,
        created_at: msg.created_at,
      }));

      setNotifications(notifs);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center space-x-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Messages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{theme === "dark" ? "Light Mode" : "Dark Mode"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "user"}`
                  }
                  alt="User"
                />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white ${userStatus === "online" ? "bg-green-500" : userStatus === "away" ? "bg-yellow-500" : userStatus === "busy" ? "bg-red-500" : "bg-gray-400"}`}
              ></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Change Avatar</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <User className="mr-2 h-4 w-4" />
                <span>Status</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={userStatus}
                  onValueChange={(value) =>
                    updateUserStatus(value as UserStatus)
                  }
                >
                  <DropdownMenuRadioItem value="online">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Online
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="away">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                    Away
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="busy">
                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                    Do Not Disturb
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="invisible">
                    <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                    Invisible
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Picture Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Profile Picture</DialogTitle>
              <DialogDescription>
                Upload a new profile picture or avatar.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={
                    avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "user"}`
                  }
                  alt="User"
                />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
              </Button>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowProfileDialog(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TopNavigation;
