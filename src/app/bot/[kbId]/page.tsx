import { prisma } from "@/lib/prisma";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function PublicBotPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ kbId: string }>, 
  searchParams: Promise<{ widget?: string }> 
}) {
  const resolvedParams = await params;
  const kbId = resolvedParams.kbId;
  const resolvedSearchParams = await searchParams;
  const isWidget = resolvedSearchParams.widget === "true";

  const kb = await prisma.knowledgeBase.findUnique({
    where: { id: kbId },
    select: {
      id: true,
      name: true,
      colorCode: true,
      prompt: true,
      isPublic: true,
    },
  });

  if (!kb || !kb.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center mx-auto text-slate-500 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-slate-200 font-semibold">Assistant Unavailable</h1>
          <p className="text-slate-400 text-sm">This assistant is private or does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${isWidget ? 'h-screen w-screen p-0 bg-transparent' : 'min-h-screen p-4 sm:p-8 bg-slate-950 bg-grid-pattern'}`}>
      <div className={`w-full max-w-3xl ${isWidget ? 'h-full' : 'shadow-2xl rounded-2xl overflow-hidden h-[90vh]'}`}>
        <ChatInterface
          kbId={kb.id}
          kbName={kb.name}
          colorCode={kb.colorCode}
          initialPrompt={kb.prompt}
          heightClass="h-full"
        />
      </div>
    </div>
  );
}
