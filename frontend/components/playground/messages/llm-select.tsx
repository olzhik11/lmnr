import { isEmpty } from "lodash";
import { Check, ChevronDown, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import useSWR from "swr";

import ProvidersAlert from "@/components/playground/providers-alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconAmazonBedrock,
  IconAnthropic,
  IconAzure,
  IconGemini,
  IconGroq,
  IconMistral,
  IconOpenAI,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { apiKeyToProvider, Provider, providers } from "@/lib/pipeline/types";
import { ProviderApiKey } from "@/lib/settings/types";
import { cn, swrFetcher } from "@/lib/utils";

const providerIconMap: Record<Provider, ReactNode> = {
  openai: <IconOpenAI />,
  anthropic: <IconAnthropic />,
  gemini: <IconGemini />,
  groq: <IconGroq />,
  mistral: <IconMistral />,
  bedrock: <IconAmazonBedrock />,
  "openai-azure": <IconAzure />,
};

const providerNameMap: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Gemini",
  groq: "Groq",
  mistral: "Mistal",
  bedrock: "Amazon Bedrock",
  "openai-azure": "Azure",
};

interface LlmSelectNewProps {
  value: string;
  disabled?: boolean;
  onChange: (id: `${Provider}:${string}`) => void;
}

const LlmSelect = ({ disabled, onChange, value }: LlmSelectNewProps) => {
  const [query, setQuery] = useState("");
  const params = useParams();
  const { data: apiKeys, isLoading } = useSWR<ProviderApiKey[]>(
    `/api/projects/${params?.projectId}/provider-api-keys`,
    swrFetcher
  );

  const options = useMemo<typeof providers>(
    () =>
      providers
        .filter((provider) => (apiKeys || [])?.map((key) => apiKeyToProvider?.[key.name]).includes(provider.provider))
        .map(({ provider, models }) => {
          const lowerQuery = query.toLowerCase();
          const providerMatches = provider.toLowerCase().includes(lowerQuery);
          const filteredModels = models.filter(({ name }) => name.toLowerCase().includes(lowerQuery));
          return providerMatches || filteredModels.length > 0
            ? { provider, models: providerMatches ? models : filteredModels }
            : null;
        })
        .filter(Boolean) as typeof providers,
    [apiKeys, query]
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger value={value} asChild>
          <Button disabled={disabled || isLoading} className="w-64 py-4" variant="outline">
            <span className="mr-2">
              {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                providerIconMap[value.split(":")[0] as Provider]
              )}
            </span>
            <span>{providers.flatMap((p) => p.models).find((m) => m.id === value)?.name ?? "Select model"}</span>
            <ChevronDown className="ml-auto" size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <div className="flex items-center px-2" onKeyDown={(e) => e.stopPropagation()}>
            <Search size={12} />
            <Input
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search model..."
              className="border-none bg-transparent focus-visible:ring-0 flex-1 h-fit rounded-none"
            />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {!isEmpty(options) ? (
              options.map((provider) => (
                <DropdownMenuSub key={provider.provider}>
                  <DropdownMenuSubTrigger>
                    <span className="mr-2">{providerIconMap[provider.provider]}</span>{" "}
                    {providerNameMap[provider.provider]}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {provider.models.map((model) => (
                        <DropdownMenuItem key={model.id} onSelect={() => onChange(model.id)}>
                          <Check size={14} className={cn("mr-2", { "opacity-0": value !== model.id })} />
                          <span className="mr-2">{providerIconMap[provider.provider]}</span> {model.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              ))
            ) : (
              <DropdownMenuSub>
                <DropdownMenuItem disabled>No models found</DropdownMenuItem>
              </DropdownMenuSub>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href={`/project/${params?.projectId}/settings`} passHref>
              <DropdownMenuItem>
                <div className="flex items-center mr-auto">
                  <Plus size={12} className="mr-2" />
                  More providers
                </div>
                <div className="flex overflow-hidden">
                  <span className="flex items-center justify-center bg-background size-5 -mr-2 border rounded-full">
                    <IconOpenAI className="size-3" />
                  </span>
                  <span className="flex items-center justify-center bg-background size-5 -mr-2 border rounded-full">
                    <IconAnthropic className="size-3" />
                  </span>
                  <span className="flex items-center justify-center bg-background size-5 border rounded-full">
                    <IconGemini className="size-3" />
                  </span>
                </div>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {!isLoading && isEmpty(apiKeys) && <ProvidersAlert />}
    </>
  );
};

export default LlmSelect;
