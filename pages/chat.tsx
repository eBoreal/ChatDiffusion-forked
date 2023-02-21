import React from "react";

import { ChannelTop } from "../components/ChannelTop";
import { ChatBar } from "../components/ChatBar";
import { MessageList } from "../components/MessageList";
import { DecisionBox } from "../components/DecisionBox"

import { redirectToLogin } from '../utils/protectRoutes'

// if not logged in redirect to /user for user to log in
export const getServerSideProps = redirectToLogin


export default function Chat() {
  const inputContainer = React.useRef<HTMLDivElement>(null);
  const mainConatiner = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    if (mainConatiner.current && inputContainer.current) {
      mainConatiner.current.style.marginTop = `calc(100vh - ${
        inputContainer.current.offsetHeight + 24
      }px - ${mainConatiner.current.offsetHeight + 24}px)`;
    }

    const ubnsub = MessageList.use.subscribe(() => {
      setTimeout(() => {
        if (mainConatiner.current && inputContainer.current) {
          mainConatiner.current.style.marginBottom = `${
            inputContainer.current.offsetHeight + 100
          }px`;
        }

        window.scrollTo({
          behavior: "smooth",
          top: document.body.scrollHeight,
        });
      }, 100);
    });

    return () => {
      ubnsub();
    };
  }, [
    inputContainer.current?.offsetHeight,
    mainConatiner.current?.offsetHeight,
  ]);

  return (
    <>
      <main className="flex flex-col gap-1 w-full" ref={mainConatiner}>
          <ChannelTop />
          <MessageList />
      </main>

      <div
          className="fixed bottom-0 w-screen bg-background"
          ref={inputContainer}>
            <ChatBar/>
      </div>
        
      <div className="fixed bottom-0 w-screen flex flex-row"
          ref={inputContainer}>
            <DecisionBox/>
      </div>

    </>
  );
}