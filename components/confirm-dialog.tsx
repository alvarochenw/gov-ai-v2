"use client"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  /** Hide cancel button for notice-style dialogs */
  hideCancel?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "确定",
  cancelLabel = "取消",
  variant = "default",
  hideCancel = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-xl p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-2 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-left text-base font-semibold tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="flex-row justify-end gap-2 px-6 pb-6 pt-4">
          {!hideCancel && (
            <DialogClose
              render={(props) => (
                <Button variant="outline" size="default" {...props} />
              )}
            >
              {cancelLabel}
            </DialogClose>
          )}
          <Button
            variant={variant}
            size="default"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
