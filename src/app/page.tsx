/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { fingLargeArray } from "@/lib/findLargeArray";
import { insertTabIndexes } from "@/lib/insertTabIndexes";
import { processJson } from "@/lib/processJson";
import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import { ChevronUp, Loader2 } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";

const BATCH_SIZE = 5;

export default function Home() {
  const [jsonState, setJsonState] = useState<{
    content: any | null;
    visibleContent: any | null;
  }>({
    content: null,
    visibleContent: null,
  });

  const [dataState, setDataState] = useState<{
    startIndex: number;
    largerKeys: string[];
  }>({
    startIndex: 0,
    largerKeys: [],
  });

  const [loadingState, setLoadingState] = useState<{
    pageLoading: boolean;
    jsonLoading: boolean;
  }>({
    pageLoading: false,
    jsonLoading: false,
  });

  const [fileStats, setFileStats] = useState<{
    title: string;
    error: boolean;
  }>({
    title: "",
    error: false,
  });

  const [onTopButton, setOnTopButton] = useState<boolean>(true);

  const jsonViewRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetStates = () => {
    setDataState({
      startIndex: 0,
      largerKeys: [],
    });
    setJsonState({
      content: null,
      visibleContent: null,
    });

    setFileStats({
      title: "",
      error: false,
    });
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];

    handleChangeLoading(true, "pageLoading");
    resetStates();
    if (!file) {
      return;
    }

    let proccessedFile = " ";
    setFileStats((prevStats) => ({
      ...prevStats,
      title: file.name,
    }));
    file
      .stream()
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(processJson())
      .pipeTo(
        new WritableStream({
          write(chunk) {
            proccessedFile += chunk;
          },
          close: () => {
            try {
              console.log(proccessedFile);
              const parsedFile = JSON.parse(proccessedFile);
              console.log(parsedFile);
              setDataState((prevState) => ({
                ...prevState,
                largerKeys: fingLargeArray(parsedFile, BATCH_SIZE),
              }));
              setJsonState({
                content: parsedFile,
                visibleContent: null,
              });
              setFileStats((prevStats) => ({
                ...prevStats,
                error: false,
              }));
            } catch (error) {
              console.log(error);
              setFileStats((prevStats) => ({
                ...prevStats,
                error: true,
              }));
              handleChangeLoading(false, "pageLoading");
            }
          },
        })
      );
  };

  const handleChangeLoading = (state: boolean, type: string) => {
    setLoadingState((prevState) => ({
      ...prevState,
      [type]: state,
    }));
  };

  const scrollToContent = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isFinishParsedJsonToVisibleContent = (): boolean => {
    if (!jsonState.visibleContent) return false;
    if (!Array.isArray(jsonState.content)) {
      return dataState.largerKeys.every((key) => {
        const value = jsonState.content[key];
        if (Array.isArray(value)) {
          return value.length <= dataState.startIndex;
        }
        return true;
      });
    }

    console.log(jsonState.content.length, jsonState.visibleContent.length);
    return jsonState.content.length <= jsonState.visibleContent.length;
  };

  useEffect(() => {
    const onScroll = () => {
      const element = document.documentElement;

      if (element.scrollTop === 0) {
        setOnTopButton(true);
      }

      if (element.scrollTop > 0) {
        setOnTopButton(false);
      }

      if (element.scrollHeight - element.scrollTop === element.clientHeight) {
        setDataState((prevState) => ({
          ...prevState,
          startIndex: prevState.startIndex + BATCH_SIZE,
        }));
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!jsonState.content) return;
    handleChangeLoading(false, "pageLoading");
    handleChangeLoading(true, "jsonLoading");
    if (isFinishParsedJsonToVisibleContent()) {
      handleChangeLoading(false, "jsonLoading");
      return;
    }

    scrollToContent();
    if (!Array.isArray(jsonState.content)) {
      console.log(dataState.largerKeys);
      if (dataState.largerKeys.length === 0) {
        setJsonState((prevState) => ({
          ...prevState,
          visibleContent: prevState.content,
        }));

        return;
      }
      dataState.largerKeys.forEach((key) => {
        let value = jsonState.content;
        let newJson = jsonState.content;
        value = value[key];

        console.log(value, key, jsonState.content);
        if (Array.isArray(value)) {
          const endIndex = Math.min(
            dataState.startIndex + BATCH_SIZE,
            value.length
          );
          const chunk = value.slice(dataState.startIndex, endIndex);
          console.log({
            ...newJson,
            [key]: chunk,
          });

          setJsonState((prevState) => ({
            ...prevState,
            visibleContent: prevState.visibleContent
              ? {
                  ...newJson,
                  [key]: [...prevState.visibleContent[key], ...chunk],
                }
              : {
                  ...newJson,
                  [key]: chunk,
                },
          }));
        }
      });
      return;
    }

    const endIndex = Math.min(
      dataState.startIndex + BATCH_SIZE,
      jsonState.content.length
    );
    const chunk = jsonState.content.slice(dataState.startIndex, endIndex);

    console.log(chunk);

    setJsonState((prevState) => ({
      ...prevState,
      visibleContent: prevState.visibleContent
        ? [...prevState.visibleContent, ...chunk]
        : chunk,
    }));
  }, [jsonState.content, dataState.startIndex]);

  useEffect(() => {
    if (!jsonState.visibleContent) return;
    insertTabIndexes();
  }, [jsonState.visibleContent]);

  useEffect(() => {
    console.log(jsonViewRef);
    if (!jsonViewRef.current) return;

    const observer = new MutationObserver((mutationsList: MutationRecord[]) => {
      console.log(mutationsList);
      if (mutationsList.length === 0) return;
      if (mutationsList.length === BATCH_SIZE)
        handleChangeLoading(false, "jsonLoading");
    });

    observer.observe(jsonViewRef.current, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    console.log(jsonViewRef.current);
    console.log(observer);
    return () => observer.disconnect();
  }, [jsonViewRef.current]);

  return (
    <>
      <main className="h-screen flex-col items-center justify-center gap-6">
        {loadingState.pageLoading && (
          <span
            className="w-full h-full absolute flex items-center justify-center bg-[#E4E4E4] opacity-80"
            tabIndex={0}
            aria-label="loading"
          >
            <Loader2 size={32} className="animate-spin" />
          </span>
        )}
        <section className="flex min-h-full flex-col items-center justify-center gap-6">
          <h1
            className="text-5xl font-bold"
            tabIndex={0}
            aria-label="titulo da página"
          >
            JSON Tree Viewer
          </h1>
          <p
            className="text-black text-2xl font-normal leading-5"
            tabIndex={0}
            aria-label="descrição da página"
          >
            Simple JSON Viewer that runs completely on-client. No data exchange
          </p>
          <div className="flex flex-col items-center justify-center text-black">
            <button
              role="input-file"
              aria-label="input file"
              className="w-28 h-8 bg-gradient-to-b from-[#E4E4E4] to-[#F7F7F7] border border-black-400 border-solid border-black rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              <span className=" text-black text-base font-medium leading-5">
                Load JSON
              </span>
            </button>
            <input
              ref={inputRef}
              id="file-input"
              type="file"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
          {fileStats.error && (
            <span className="text-[#BF0E0E] text-lg font-normal leading-5">
              Invalid file. Please load a valid JSON file.
            </span>
          )}
        </section>
      </main>

      {jsonState.content && (
        <div
          id="json-view"
          className="h-full w-full p-4 bg-gray-200  flex flex-col items-center justify-center"
        >
          <div
            className={`w-4/5 ${
              jsonState.visibleContent ? "h-full" : "h-screen"
            }`}
          >
            {jsonState.visibleContent && (
              <>
                <span
                  className="text-2xl font-bold text-black p-1"
                  tabIndex={0}
                >
                  {fileStats.title}
                </span>

                <div className="h-full bg-zinc-200 rounded-md p-2">
                  <JsonView
                    ref={jsonViewRef}
                    style={lightTheme}
                    value={jsonState.visibleContent}
                    collapsed={false}
                    enableClipboard={false}
                    displayDataTypes={false}
                    displayObjectSize={false}
                  />
                </div>

                <button
                  onClick={scrollToTop}
                  className={`w-12 h-12 bg-[#F7F7F7] rounded-full flex items-center justify-center fixed bottom-4 right-4 ${
                    onTopButton ? "hidden" : ""
                  }`}
                >
                  <ChevronUp size={32} />
                </button>
              </>
            )}
            {loadingState.jsonLoading && (
              <span className="w-full h-full flex items-center justify-center">
                <Loader2 size={32} className="animate-spin" />
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
