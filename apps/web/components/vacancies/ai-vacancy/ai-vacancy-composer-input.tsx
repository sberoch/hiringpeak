"use client";

import { ArrowUp, FileIcon, Paperclip, Sparkles, X } from "lucide-react";

import {
  FileUploader,
  useFileUpload,
} from "@workspace/ui/components/file-upload";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";

const AI_VACANCY_FILE_ACCEPT = {
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
} as const;

const AI_VACANCY_MAX_FILES = 5;
const AI_VACANCY_MAX_FILE_BYTES = 10 * 1024 * 1024;

interface AiVacancyComposerInputProps {
  prompt: string;
  files: File[];
  onPromptChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onSubmit?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  textareaId?: string;
  placeholder?: string;
  showSubmitButton?: boolean;
  className?: string;
  containerClassName?: string;
}

export function AiVacancyComposerInput({
  prompt,
  files,
  onPromptChange,
  onFilesChange,
  onSubmit,
  isGenerating = false,
  disabled = false,
  textareaId = "vacancy-ai-prompt",
  placeholder = "Ej: Busco gerente comercial para retail en Buenos Aires, con inglés, experiencia en consumo masivo y liderazgo regional.",
  showSubmitButton = true,
  className,
  containerClassName,
}: AiVacancyComposerInputProps) {
  return (
    <FileUploader
      value={files}
      onValueChange={(nextFiles) => onFilesChange(nextFiles ?? [])}
      dropzoneOptions={{
        accept: AI_VACANCY_FILE_ACCEPT,
        maxSize: AI_VACANCY_MAX_FILE_BYTES,
        multiple: true,
        maxFiles: AI_VACANCY_MAX_FILES,
        disabled: disabled || isGenerating,
        noClick: true,
        noKeyboard: true,
      }}
      className={className}
    >
      <ComposerInputBody
        prompt={prompt}
        files={files}
        onPromptChange={onPromptChange}
        onSubmit={onSubmit}
        isGenerating={isGenerating}
        disabled={disabled}
        textareaId={textareaId}
        placeholder={placeholder}
        showSubmitButton={showSubmitButton}
        containerClassName={containerClassName}
      />
    </FileUploader>
  );
}

interface ComposerInputBodyProps {
  prompt: string;
  files: File[];
  onPromptChange: (value: string) => void;
  onSubmit?: () => void;
  isGenerating: boolean;
  disabled: boolean;
  textareaId: string;
  placeholder: string;
  showSubmitButton: boolean;
  containerClassName?: string;
}

function ComposerInputBody({
  prompt,
  files,
  onPromptChange,
  onSubmit,
  isGenerating,
  disabled,
  textareaId,
  placeholder,
  showSubmitButton,
  containerClassName,
}: ComposerInputBodyProps) {
  const { dropzoneState, removeFileFromSet, isLOF } = useFileUpload();
  const canSubmit =
    (prompt.trim().length > 0 || files.length > 0) && !isGenerating && !disabled;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      onSubmit &&
      (event.metaKey || event.ctrlKey) &&
      event.key === "Enter" &&
      canSubmit
    ) {
      event.preventDefault();
      onSubmit();
    }
  };

  const openFilePicker = () => {
    if (!isLOF && !disabled && !isGenerating) {
      dropzoneState.inputRef.current?.click();
    }
  };

  const { onKeyDown: _dropzoneKeyDown, ...rootProps } = dropzoneState.getRootProps();

  return (
    <div
      {...rootProps}
      className={cn(
        "overflow-hidden rounded-2xl border border-brand-border bg-surface shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03),0_20px_40px_-12px_rgba(0,0,0,0.06)]",
        "transition-all duration-200",
        "focus-within:border-electric focus-within:shadow-[0_0_0_4px_rgba(0,102,255,0.1)]",
        dropzoneState.isDragActive && "border-electric bg-electric/5",
        (disabled || isGenerating) && "opacity-90",
        containerClassName,
      )}
      aria-busy={isGenerating}
    >
      <input {...dropzoneState.getInputProps()} />

      {files.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-brand-border/80 px-4 pt-4 pb-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="group relative flex max-w-full items-center gap-2 rounded-lg border border-brand-border bg-canvas px-2.5 py-1.5 pr-8"
            >
              <FileIcon className="h-4 w-4 shrink-0 text-electric" />
              <span className="truncate text-sm font-medium text-ink">{file.name}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeFileFromSet(index);
                }}
                disabled={disabled || isGenerating}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 text-muted-brand transition-colors hover:bg-brand-border-light hover:text-ink disabled:opacity-50"
                aria-label={`Quitar ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <Textarea
        id={textareaId}
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isGenerating}
        className="min-h-[120px] resize-none border-0 bg-transparent px-5 pt-4 pb-2 text-base text-ink shadow-none placeholder:text-muted-brand focus-visible:ring-0"
      />

      <div className="flex items-center justify-between gap-3 border-t border-brand-border/80 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
            disabled={disabled || isGenerating || isLOF}
            className="h-9 w-9 shrink-0 rounded-lg text-muted-brand hover:bg-brand-border-light hover:text-ink"
            aria-label="Adjuntar archivos"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          {onSubmit ? (
            <p className="hidden text-xs text-muted-brand sm:block">
              <kbd className="rounded border border-brand-border bg-canvas px-1.5 py-0.5 font-mono text-[10px]">
                ⌘
              </kbd>{" "}
              + Enter para generar
            </p>
          ) : (
            <p className="text-xs text-muted-brand">PDF, DOCX o TXT · hasta 5 archivos</p>
          )}
        </div>

        {showSubmitButton && onSubmit ? (
          <Button
            type="button"
            size="icon"
            disabled={!canSubmit}
            onClick={(event) => {
              event.stopPropagation();
              onSubmit();
            }}
            aria-label={isGenerating ? "Generando vacante" : "Generar vacante"}
            className="h-10 w-10 shrink-0 rounded-full bg-electric text-white hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] disabled:opacity-40"
          >
            {isGenerating ? (
              <Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
