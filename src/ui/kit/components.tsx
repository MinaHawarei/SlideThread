import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import * as Slider from '@radix-ui/react-slider';
import * as Tabs from '@radix-ui/react-tabs';
import * as Toast from '@radix-ui/react-toast';
import * as Tooltip from '@radix-ui/react-tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button({ variant = 'primary', className = '', ...props }, ref) {
  return <button ref={ref} className={`atelier-button atelier-button-${variant} ${className}`.trim()} {...props} />;
});

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`atelier-field ${props.className || ''}`.trim()} {...props} />;
}

export const DialogRoot = Dialog.Root;
export const DialogTrigger = Dialog.Trigger;
export const DialogPortal = Dialog.Portal;
export const DialogClose = Dialog.Close;
export const DialogOverlay = Dialog.Overlay;
export const DialogContent = Dialog.Content;
export const DialogTitle = Dialog.Title;
export const DialogDescription = Dialog.Description;
export const PopoverRoot = Popover.Root;
export const PopoverTrigger = Popover.Trigger;
export const PopoverContent = Popover.Content;
export const TabsRoot = Tabs.Root;
export const TabsList = Tabs.List;
export const TabsTrigger = Tabs.Trigger;
export const TabsContent = Tabs.Content;
export const MenuRoot = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;
export const MenuContent = DropdownMenu.Content;
export const MenuItem = DropdownMenu.Item;
export const MenuSeparator = DropdownMenu.Separator;
export const SliderRoot = Slider.Root;
export const SliderTrack = Slider.Track;
export const SliderRange = Slider.Range;
export const SliderThumb = Slider.Thumb;
export const TooltipProvider = Tooltip.Provider;
export const TooltipRoot = Tooltip.Root;
export const TooltipTrigger = Tooltip.Trigger;
export const TooltipContent = Tooltip.Content;
export const ToastProvider = Toast.Provider;
export const ToastRoot = Toast.Root;
export const ToastTitle = Toast.Title;
export const ToastDescription = Toast.Description;
export const ToastAction = Toast.Action;
export const ToastViewport = Toast.Viewport;
