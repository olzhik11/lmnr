"use client";
import { Loader2, PlayIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Controller, SubmitHandler, useFormContext } from "react-hook-form";

import Messages from "@/components/playground/messages";
import LlmSelect from "@/components/playground/messages/llm-select";
import { useToast } from "@/lib/hooks/use-toast";
import { PlaygroundForm } from "@/lib/playground/types";
import { addInputs, parseSystemMessages } from "@/lib/playground/utils";
import { ProviderApiKey } from "@/lib/settings/types";
import { streamReader } from "@/lib/utils";

import { Button } from "../ui/button";
import Formatter from "../ui/formatter";
import { ScrollArea } from "../ui/scroll-area";

export default function PlaygroundPanel({ apiKeys, isUpdating }: { apiKeys: ProviderApiKey[]; isUpdating: boolean }) {
  const params = useParams();
  const { toast } = useToast();
  const [inputs, setInputs] = useState<string>("{}");
  const [output, setOutput] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useFormContext<PlaygroundForm>();

  const submit: SubmitHandler<PlaygroundForm> = async (form) => {
    try {
      setIsLoading(true);
      setOutput("");
      const inputValues: Record<string, any> = JSON.parse(inputs);

      const response = await fetch(`/api/projects/${params?.projectId}/chat`, {
        method: "POST",
        body: JSON.stringify({
          projectId: params?.projectId,
          model: form.model,
          messages: parseSystemMessages(addInputs(form.messages, inputValues)),
        }),
      });

      const stream = response.body?.pipeThrough(new TextDecoderStream());

      if (!stream) {
        throw new Error("No stream found.");
      }

      await streamReader(stream, (chunk) => {
        setOutput((prev) => prev + chunk);
      });
    } catch (e) {
      if (e instanceof Error) {
        toast({ title: e.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollArea className="flex-grow overflow-auto">
      <div className="max-h-0">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2"></div>
          <Controller
            render={({ field: { value, onChange } }) => (
              <LlmSelect apiKeys={apiKeys} value={value} onChange={onChange} />
            )}
            name="model"
            control={control}
          />
          <Messages />
        </div>
        <div className="px-4">
          <Button onClick={handleSubmit(submit)} disabled={isUpdating || isLoading}>
            {isUpdating || isLoading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <PlayIcon className="w-4 h-4 mr-1" />
            )}
            Run
          </Button>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <div className="text-sm font-medium">Inputs</div>
              <Formatter
                value={inputs}
                onChange={(value) => {
                  setInputs(value);
                }}
                editable={true}
                defaultMode="json"
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="text-sm font-medium">Output</div>
              <Formatter value={output} editable={false} defaultMode="json" />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
