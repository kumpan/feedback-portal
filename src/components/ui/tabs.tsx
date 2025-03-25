"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabsContextType = {
  activeTab: string;
  setActiveTab: (id: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps {
  defaultValue?: string;
  value?: string;
  children: ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  value,
  children,
  className,
  onValueChange,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue || ""
  );

  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : uncontrolledValue;

  const handleTabChange = (tabValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(tabValue);
    }
    if (onValueChange) {
      onValueChange(tabValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-lg bg-foreground p-1 gap-1",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function TabsTrigger({ value, children, className, icon }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex cursor-pointer gap-2 items-center text-background justify-center whitespace-nowrap rounded-sm h-full ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        icon ? "pl-3 pr-4" : "px-4", 
        isActive ? "bg-background text-foreground" : "hover:bg-background/30",
        className
      )}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
}
