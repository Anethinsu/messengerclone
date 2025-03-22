import React, { useState, useEffect } from "react";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import UsersList from "../messenger/UsersList";
import ConversationList from "../messenger/ConversationList";
import ChatArea from "../messenger/ChatArea";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("messages");
  const [showUsersList, setShowUsersList] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Parse conversation ID from URL if present
    const searchParams = new URLSearchParams(location.search);
    const conversationId = searchParams.get("conversation");
    if (conversationId) {
      setActiveConversationId(conversationId);
    }

    // Update user status to online
    if (user) {
      updateUserStatus(true);
    }

    // Set user to offline when they leave
    return () => {
      if (user) {
        updateUserStatus(false);
      }
    };
  }, [location, user]);

  const updateUserStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      // Check if user status exists
      const { data: existingStatus } = await supabase
        .from("user_status")
        .select("id")
        .eq("user_id", user.id);

      if (existingStatus && existingStatus.length > 0) {
        // Update existing status
        await supabase
          .from("user_status")
          .update({
            is_online: isOnline,
            last_active: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        // Create new status
        await supabase.from("user_status").insert({
          user_id: user.id,
          is_online: isOnline,
          last_active: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId);
    // Update URL without reloading the page
    navigate(`/dashboard?conversation=${conversationId}`, { replace: true });
  };

  const handleNewConversation = () => {
    setShowUsersList(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar
          activeItem="Messages"
          items={[
            {
              icon: <i className="h-5 w-5" />,
              label: "Messages",
              isActive: true,
            },
          ]}
          onItemClick={(label) => setActiveTab(label.toLowerCase())}
        />
        <main className="flex-1 overflow-hidden">
          <Tabs value={activeTab} className="h-full">
            <div className="border-b border-gray-200 bg-white px-6">
              <TabsList className="h-14">
                <TabsTrigger
                  value="messages"
                  onClick={() => setActiveTab("messages")}
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-4"
                >
                  Messages
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="messages"
              className="h-[calc(100%-3.5rem)] m-0 p-0"
            >
              <div className="grid grid-cols-[350px_1fr] h-full">
                <ConversationList
                  activeConversationId={activeConversationId || undefined}
                  onConversationSelect={handleConversationSelect}
                  onNewConversation={handleNewConversation}
                />
                <ChatArea conversationId={activeConversationId} />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Users List Dialog */}
      <Dialog open={showUsersList} onOpenChange={setShowUsersList}>
        <DialogContent className="sm:max-w-md">
          <UsersList />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
