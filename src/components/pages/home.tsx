import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";

export default function LandingPage() {
  const { user, signOut } = useAuth();

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl text-blue-600">
              Messenger Clone
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium hover:text-blue-600"
                  >
                    Messages
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 hover:cursor-pointer border-2 border-blue-200">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt={user.email || ""}
                      />
                      <AvatarFallback>
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-xl border-none shadow-lg"
                  >
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={() => signOut()}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium hover:text-blue-600"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm px-4">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero section */}
        <section className="py-20 text-center bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-5xl font-bold tracking-tight mb-4 text-gray-900">
              Connect with friends instantly
            </h2>
            <h3 className="text-xl font-medium text-gray-600 mb-8 max-w-2xl mx-auto">
              A real-time messaging platform that keeps you connected with the
              people who matter most.
            </h3>
            <div className="flex justify-center space-x-6 mb-12">
              <Link to="/signup">
                <Button className="rounded-md bg-blue-600 text-white hover:bg-blue-700 px-8 py-6 text-lg font-medium">
                  Start Messaging
                </Button>
              </Link>
            </div>

            {/* App Preview */}
            <div className="relative max-w-4xl mx-auto mt-8 shadow-2xl rounded-xl overflow-hidden border border-gray-200">
              <div className="bg-white p-2">
                <div className="flex border rounded-lg overflow-hidden">
                  {/* Sidebar */}
                  <div className="w-1/3 border-r">
                    <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-semibold">Chats</h3>
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="overflow-y-auto h-96">
                      {/* Chat list items */}
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer ${i === 1 ? "bg-blue-50" : ""}`}
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`}
                              />
                              <AvatarFallback>U{i}</AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${i % 2 === 0 ? "bg-green-500" : "bg-gray-300"} border-2 border-white`}
                            ></span>
                          </div>
                          <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-sm truncate">
                                User {i}
                              </h4>
                              <span className="text-xs text-gray-500">2m</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {i === 1
                                ? "Typing..."
                                : `This is message preview ${i}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat area */}
                  <div className="w-2/3 flex flex-col">
                    {/* Chat header */}
                    <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" />
                          <AvatarFallback>U1</AvatarFallback>
                        </Avatar>
                        <div className="ml-2">
                          <h4 className="font-medium text-sm">User 1</h4>
                          <p className="text-xs text-green-500">Online</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-600"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                          </svg>
                        </div>
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-600"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 h-72">
                      <div className="flex flex-col space-y-4">
                        {/* Received message */}
                        <div className="flex items-end">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" />
                            <AvatarFallback>U1</AvatarFallback>
                          </Avatar>
                          <div className="bg-white rounded-lg rounded-bl-none p-3 max-w-xs shadow-sm">
                            <p className="text-sm">
                              Hey there! How are you doing today?
                            </p>
                            <span className="text-xs text-gray-500 mt-1 block">
                              10:30 AM
                            </span>
                          </div>
                        </div>

                        {/* Sent message */}
                        <div className="flex items-end justify-end">
                          <div className="bg-blue-600 text-white rounded-lg rounded-br-none p-3 max-w-xs shadow-sm">
                            <p className="text-sm">
                              I'm doing great! Just checking out this new
                              messenger app.
                            </p>
                            <div className="flex items-center justify-end mt-1 space-x-1">
                              <span className="text-xs text-blue-100">
                                10:32 AM
                              </span>
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
                            </div>
                          </div>
                        </div>

                        {/* Received message */}
                        <div className="flex items-end">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" />
                            <AvatarFallback>U1</AvatarFallback>
                          </Avatar>
                          <div className="bg-white rounded-lg rounded-bl-none p-3 max-w-xs shadow-sm">
                            <p className="text-sm">
                              It looks amazing! I love the clean interface.
                            </p>
                            <span className="text-xs text-gray-500 mt-1 block">
                              10:33 AM
                            </span>
                          </div>
                        </div>

                        {/* Typing indicator */}
                        <div className="flex items-end">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" />
                            <AvatarFallback>U1</AvatarFallback>
                          </Avatar>
                          <div className="bg-gray-200 rounded-full px-4 py-2">
                            <div className="flex space-x-1">
                              <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                              <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message input */}
                    <div className="p-3 border-t bg-white">
                      <div className="flex items-center">
                        <div className="flex space-x-2 mr-2">
                          <button className="h-8 w-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100 2h6a1 1 0 100-2H7z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button className="h-8 w-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Type a message..."
                          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <button className="ml-2 h-10 w-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-blue-50 p-8 rounded-xl text-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Real-time Messaging
                </h3>
                <p className="text-gray-600">
                  Send and receive messages instantly with real-time delivery
                  and read receipts.
                </p>
              </div>

              <div className="bg-blue-50 p-8 rounded-xl text-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Emoji & Attachments
                </h3>
                <p className="text-gray-600">
                  Express yourself with emojis and easily share photos, videos,
                  and files.
                </p>
              </div>

              <div className="bg-blue-50 p-8 rounded-xl text-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure Messaging</h3>
                <p className="text-gray-600">
                  Your conversations are private and protected with end-to-end
                  encryption.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call-to-action section */}
        <section className="py-20 bg-blue-600 text-white text-center">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6">
              Ready to start messaging?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of users already connecting on our platform.
            </p>
            <Link to="/signup">
              <Button className="rounded-md bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg font-medium">
                Create Your Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-12 text-sm text-gray-600">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="border-b border-gray-200 pb-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Messenger Clone
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Security
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Mobile App
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Desktop App
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Community
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Developers
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    News
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    GDPR
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="py-4">
            <p>© 2025 Messenger Clone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
