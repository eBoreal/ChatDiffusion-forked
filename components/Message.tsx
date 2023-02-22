import { Frown, Smile, Wand2 } from "lucide-react";
import React from "react";
import { Button } from "./Button";
import { ChatBar } from "./ChatBar";
import { Image } from "./Image";
import { MessageList, sessionID, makeId } from "./MessageList";
import { PromptBook } from "./PromptBook";
import { PromptEngine } from "./PromptEngine";
import { Settings } from "./Settings";
import { FootBar } from "./FootBar";


export function Message({ id }: { id: string }) {
  const [message, editMessage] = MessageList.useMessage(id);
  const [selectedImage, setSelectedImage] = React.useState(-1);

  const savedPrompts = PromptBook.use((state) => state.prompts);

  return (
    <div className={`my-2 w-full hover:bg-black/10 group`}>
      <div
        className={`mx-auto max-w-[60rem] relative px-2 lg:px-0 flex flex-col w-full ${
          message.type === "you" ? "items-end" : "items-start"
        }`}
      >
        {message.images && message.images.length > 0 && (
          <div className="absolute hidden group-hover:flex top-0 -translate-y-[50%] duration-200 right-0 hover:drop-shadow-lg flex-row rounded overflow-hidden bg-chatbox">
            <div
              onClick={() => Message.rateMessage(message, 1)}
              className={`p-1.5 border-r border-[#31363f] last-of-type:border-transparent duration-200 cursor-pointer ${
                message.rating < 3
                  ? "bg-white/[7%] text-red-300"
                  : "text-red-300/30 hover:text-red-300 hover:bg-white/5"
              }`}
            >
              <Frown size={24} />
            </div>
            <div
              onClick={() => Message.rateMessage(message, 5)}
              className={`p-1.5 border-r border-[#31363f] last-of-type:border-transparent duration-200 cursor-pointer ${
                message.rating > 3
                  ? "bg-white/[7%] text-green-300"
                  : "text-green-300/30 hover:text-green-300 hover:bg-white/5"
              }`}
            >
              <Smile size={24} />
            </div>
          </div>
        )}
        {message.rating !== 3 && (
          <div className="absolute top-0 right-0 block group-hover:hidden">
            {message.rating < 3 && (
              <Frown className="text-red-300/30" size={24} />
            )}
            {message.rating > 3 && (
              <Smile className="text-green-300/30" size={24} />
            )}
          </div>
        )}
        <div className="flex flex-row gap-2 items-end h-fit">
          <h1 className="font-semibold text-white">
            {message.type === "you" ? "You" : message.type}
          </h1>
          {message.timestamp && (
            <p className="text-white/30 text-xs pb-0.5">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          )}
          {message.modifiers && (
            <Wand2 className="text-white/30 pb-[3px]" size={16} />
          )}
        </div>
        {message.prompt && message.type === "you" && (
          <p className="text-white/75 text-left break-word">{message.prompt}</p>
        )}
        {message.images && message.settings && message.images.length > 0 && (
          <div
            className={`flex flex-row gap-2 overflow-hidden flex-wrap max-w-full`}
          >
            {message.images.map((image, i) => (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <Image
                key={i}
                i={i}
                image={image}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                message={message}
              />
            ))}
          </div>
        )}
        {message.error && <p className="text-red-500">{message.error}</p>}
        {message.loading && message.images && message.images.length === 0 && (
          <div className="flex flex-row gap-1 my-3">
            <div className="animate-pulse bg-white/25 w-3 h-3 rounded-full" />
            <div className="animate-pulse bg-white/25 delay-75 w-3 h-3 rounded-full" />
            <div className="animate-pulse bg-white/25 delay-150 w-3 h-3 rounded-full" />
          </div>
        )}
        {message.buttons && message.buttons.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2 my-2">
            {message.buttons.map((btn, i) => {
              if (
                btn.id === "save_prompt" &&
                (!message.prompt || savedPrompts.includes(message.prompt))
              )
                return null;

              return (
                <Button
                  key={i}
                  btn={btn}
                  message={message}
                  selectedImage={selectedImage}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export enum MessageType {
  YOU = "you",
  STABLE_DIFFUSION = "stable diffusion",
  OTHER = "other",
  SYSTEM = "system",
  PIX2PIX = "pix2pix"
}

export type Message = {
  type: MessageType;
  id: string;
  timestamp: number;
  prompt: string;
  modifiers: string | undefined;
  loading: boolean;
  buttons: Button[];
  error: string | null;
  images: Artifact[];
  settings: Settings | null;
  rating: number;
};

export type Artifact = {
  image: string;
  seed: number;
  id: string;
};

const SURE_ANIME_WORDS = [
  "1girl",
  "2girls",
  "highres",
  "looking at viewer",
  "looking_at_viewer",
];

const POSSIBLE_ANIME_WORDS = [
  "breasts",
  "skirt",
  "blush",
  "smile",
  "solo",
  "simple background",
  "simple_background",
  "multiple girls",
  "multiple_girls",
];

export namespace Message {
  export const b64toBlob = (b64Data: string, contentType = "") => {
    // Decode the base64 string into a new Buffer object
    const buffer = Buffer.from(b64Data, "base64");

    // Create a new blob object from the buffer
    return new Blob([buffer], { type: contentType });
  };

  export const rateMessage = async (message: Message, rating: number) => {
    MessageList.use.setState((state) => {
      const newMessages = { ...state.messages };
      newMessages[message.id].rating = rating;
      return { ...state, messages: newMessages };
    });

    let res = null;
    try {
      res = await fetch("https://api.diffusion.chat/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: message.images.map((img) => img.id),
          rating,
        }),
      });
    } catch (e) {
      console.log(e);
    }

    if (!res || !res.ok) {
      MessageList.use.setState((state) => {
        const newMessages = { ...state.messages };
        newMessages[message.id].rating = 3;
        return { ...state, messages: newMessages };
      });
    } else {
      console.log("rated", res);
    }
  };

  export const addImageMessage = async (
    imageUrl: string
  ) => {
    const uid = makeId();
    
    const settings = Settings.use.getState().settings;
    const newMsg: Message = {
      type: MessageType.YOU,
      id: uid,
      prompt: '',
      timestamp: Date.now(),
      loading: false,
      buttons: [],
      error: null,
      images: [{
        image: imageUrl,
        seed: 42,
        id: "some-string"
      }],
      modifiers: undefined,
      settings: settings,
      rating: 3,
    };

    newMsg.buttons = [
      {
        text: "Download",
        id: "save",
      },
    ];

    MessageList.use.getState().addMessage(newMsg);  
  }

  export const sendMessage = async (
    prompt: string,
    userId: string | undefined,
    credits: string,
    modifiers?: string
  ) => {

    if (!prompt && !modifiers) return;
    if (!userId) return;

    const settings = Settings.use.getState().settings;
    Settings.use.getState().setOpen(false);
    ChatBar.use.getState().setPrompt("");

    const uid = makeId();
    const newMsg: Message = {
      type: MessageType.YOU,
      id: uid,
      prompt: prompt,
      modifiers: modifiers || undefined,
      timestamp: Date.now(),
      loading: true,
      buttons: [],
      error: null,
      images: [],
      settings: settings,
      rating: 3,
    };
    const model = settings.model
    MessageList.use.getState().addMessage(newMsg);

    if (!credits) {
      newMsg.error = "You do not have enough credits. Go to your Account to add some and keep chatting :)";
      newMsg.loading = false;
      MessageList.use.getState().editMessage(uid, newMsg);
      FootBar.use.getState().setHidden(false);
      ChatBar.use.getState().setHidden(true);
      return;
    }

    if (model !== "instruct-pix2pix" && model !== "stable-diffusion-v1-5") {
      newMsg.loading = false;
      newMsg.error = `Support for ${settings.model} is not implemented yet`;
      MessageList.use.getState().editMessage(uid, newMsg);
      FootBar.use.getState().setHidden(false)
      ChatBar.use.getState().setHidden(true)
      return;
    }
    
    let res;
    let inputMsg;
    if (model == "instruct-pix2pix" && newMsg.prompt) {
      // recover last message with image
      let lastImages = null;
      const lastN = MessageList.getLastNMessages(10)
      for (let m of lastN) {
        if (m.images.length > 0) {
          lastImages = m.images
          break
        }
      }
      if (!lastImages) {
        newMsg.error = "Pix2pix needs an image to edit, add one by draging it over to the Image to Image box";
        newMsg.loading = false;
        MessageList.use.getState().editMessage(uid, newMsg);
        FootBar.use.getState().setHidden(false)
        ChatBar.use.getState().setHidden(true)
        return;
      }

      try {
        res = await askPix2Pix(newMsg, lastImages)
      } catch (e) {
        console.log("Request to pix2pix failed: ", e)
      }
    }

    // -- implement support for SD here -- //
    if (model == "stable-diffusion-v1-5") {
      if (prompt.length < 150 && !modifiers) {
        modifiers = PromptEngine.getModifers();
      }
  
      if (settings.modify && modifiers) {
        prompt = prompt + ", " + modifiers;
      }

      newMsg.prompt = prompt

      res = await askSD15(newMsg)
    }

    // process request results
    if (!res || !res.ok) {
      switch (res?.status) {
        case 400:
          newMsg.error = "Something is wrong with your request";
          break;
        case 429:
          newMsg.error = "You're too fast! Slow down!";
          break;
        case 504:
          newMsg.error = "Timeout ! The server is warming up. Wait a few seconds and try again.";
          break;
        default:
          newMsg.error = "Something went wrong";
          break;
      }
      newMsg.loading = false;
      newMsg.buttons = [
        {
          text: "Retry",
          id: "regenerate",
        },
      ];
      MessageList.use.getState().editMessage(uid, newMsg);
      FootBar.use.getState().setHidden(false);
      ChatBar.use.getState().setHidden(true);
      return;
    }

    // model responded
    const data = await res.json();
    newMsg.loading = false;

    if (data.length == 0) {
      newMsg.error = "No results";
      newMsg.buttons = [
        {
          text: "Retry",
          id: "regenerate",
        },
      ];
      return;
    }
    MessageList.use.getState().editMessage(uid, newMsg);
    
    // decrement credits
    let supaRes;
    try {
      supaRes = await askSupabase(userId);
      
    } catch (e) {
      console.log("Decrementing failed: ", e);
      return;
    }

    // model responded with something
    const res_uid = makeId();
    const type = (
      model === "instruct-pix2pix" 
        ? MessageType.PIX2PIX
        : MessageType.STABLE_DIFFUSION);

    const resMsg: Message = {
      type: type,
      id: res_uid,
      prompt: prompt,
      modifiers: modifiers || undefined,
      timestamp: Date.now(),
      loading: true,
      buttons: [],
      error: null,
      images: data,
      settings: settings,
      rating: 3,
    };


    resMsg.loading = false;
    resMsg.buttons = [
      {
        text: "Regenerate",
        id: "regenerate",
      },
      {
        text: "Download",
        id: "save",
      },
      {
        text: "Save Prompt",
        id: "save_prompt",
      },
    ];

    if (newMsg.modifiers) {
      resMsg.buttons.push({
        text: "Remix",
        id: "remix",
      });
    }

    MessageList.use.getState().addMessage(resMsg);

    FootBar.use.getState().setHidden(false)
    ChatBar.use.getState().setHidden(true)
  }

  export const askSupabase = async (
    userId: string,
  ) => {
    // fetch api
    return fetch("api/decrement-credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId
      })
    })
  }

  export const askSD15 = async (
    newMsg: Message,
  ) => {
    // fetch api
    return fetch("api/sd15", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: newMsg.prompt,
        height: newMsg.settings?.height,
        width: newMsg.settings?.width,
        steps: newMsg.settings?.steps,
        text_cfg_scale: newMsg.settings?.scale,
      })
    })
  }

  export const askPix2Pix = async (
    newMsg: Message,
    lastImages: Artifact[]
  ) => {

    // fetch api
    return fetch("api/pix2pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newMsg.prompt,
          images: lastImages,
          steps: newMsg.settings?.steps,
          text_cfg_scale: newMsg.settings?.scale,
          image_cfg_scale: newMsg.settings?.img_scale,
          randomize_cfg: newMsg.settings?.randomize_cfg,
        })
      })
  };

}
