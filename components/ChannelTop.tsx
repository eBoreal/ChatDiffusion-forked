import { MessageCircle } from "lucide-react";

export function ChannelTop() {
  return (
    <>
      <div className="flex flex-col gap-3 pb-6 mx-auto max-w-[60rem] mb-28 p-2 lg:p-0 w-full">
        <div className="p-3 rounded-full bg-white/10 w-fit">
          <MessageCircle className="text-white/75" size={32} />
        </div>
        <h1 className="text-4xl font-bold">Welcome to #ChatDiffusion</h1>
        <h2 className="text-white/75 text-lg">
          Edit your images from text.
        </h2>
        <div className="border-b border-white/5" />
      </div>
    </>
  );
}