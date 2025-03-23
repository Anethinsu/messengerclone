import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Code, Database, Server } from "lucide-react";

const Documentation = () => {
  const [activeTab, setActiveTab] = useState("local-development");
  const [markdownContent, setMarkdownContent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMarkdownContent = async () => {
      try {
        let response;
        switch (activeTab) {
          case "local-development":
            response = await fetch("/src/docs/LocalDevelopment.md");
            break;
          default:
            response = await fetch("/src/docs/LocalDevelopment.md");
        }

        if (response.ok) {
          const content = await response.text();
          setMarkdownContent(content);
        } else {
          setMarkdownContent("# Error\nFailed to load documentation content.");
        }
      } catch (error) {
        console.error("Error fetching markdown content:", error);
        setMarkdownContent("# Error\nFailed to load documentation content.");
      }
    };

    fetchMarkdownContent();
  }, [activeTab]);

  // Simple markdown parser (for basic markdown only)
  const renderMarkdown = (markdown: string) => {
    // Convert headers
    let html = markdown
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-4 mt-6">$1</h1>')
      .replace(
        /^## (.+)$/gm,
        '<h2 class="text-2xl font-bold mb-3 mt-5">$1</h2>',
      )
      .replace(
        /^### (.+)$/gm,
        '<h3 class="text-xl font-bold mb-2 mt-4">$1</h3>',
      )
      // Convert code blocks
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md my-4 overflow-x-auto"><code>$1</code></pre>',
      )
      // Convert inline code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">$1</code>',
      )
      // Convert lists
      .replace(/^\s*-\s+(.+)$/gm, '<li class="ml-6 list-disc">$1</li>')
      .replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="ml-6 list-decimal">$1</li>')
      // Convert paragraphs
      .replace(/^(?!<[hl]|<pre|<li)(.+)$/gm, '<p class="mb-4">$1</p>')
      // Group list items
      .replace(
        /(<li[^>]*>[\s\S]*?)(?=<h|<p|<pre|$)/g,
        '<ul class="my-4">$1</ul>',
      );

    return { __html: html };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar
          activeItem="Documentation"
          items={[
            {
              icon: <FileText className="h-5 w-5" />,
              label: "Documentation",
              isActive: true,
            },
          ]}
          onItemClick={() => {}}
        />
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Documentation
              </h1>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 dark:text-gray-300"
              >
                Back to Dashboard
              </Button>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-6 bg-white dark:bg-gray-800 p-1 rounded-lg">
                <TabsTrigger
                  value="local-development"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400"
                >
                  <Code className="h-4 w-4" />
                  Local Development
                </TabsTrigger>
                <TabsTrigger
                  value="database"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400"
                  disabled
                >
                  <Database className="h-4 w-4" />
                  Database Schema
                </TabsTrigger>
                <TabsTrigger
                  value="api"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400"
                  disabled
                >
                  <Server className="h-4 w-4" />
                  API Reference
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="local-development"
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div
                  className="prose prose-blue max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={renderMarkdown(markdownContent)}
                />
              </TabsContent>

              <TabsContent
                value="database"
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <p className="text-gray-500 dark:text-gray-400">
                  Database schema documentation coming soon.
                </p>
              </TabsContent>

              <TabsContent
                value="api"
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <p className="text-gray-500 dark:text-gray-400">
                  API reference documentation coming soon.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Documentation;
