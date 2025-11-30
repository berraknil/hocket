"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar";
import { Link } from "react-router-dom";
import { repoUrl, changeLogUrl } from "@/settings.json";

interface MenuProps {
  onSessionConfigure?: (e: Event) => void;
  onSessionChangeUsername?: (e: Event) => void;
  onSessionNew?: (e: Event) => void;
  onSessionSave?: (e: Event) => void;
  onSessionDownload?: (e: Event) => void;
  onViewLayoutAdd?: (e: Event) => void;
  onViewLayoutRemove?: (e: Event) => void;
  isAuthenticated?: boolean;
  isReadOnly?: boolean;
}

export default function SessionMenu({
  onSessionConfigure,
  onSessionChangeUsername,
  onSessionNew,
  onSessionSave,
  onSessionDownload,
  onViewLayoutAdd,
  onViewLayoutRemove,
  isAuthenticated = false,
  isReadOnly = false,
}: MenuProps) {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Session</MenubarTrigger>
        <MenubarContent>
          <MenubarItem disabled onSelect={onSessionConfigure}>
            Configure<MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={onSessionChangeUsername}>
            Change username
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={onSessionNew}>New</MenubarItem>
          <MenubarSeparator />
          {isAuthenticated && (
            <>
              <MenubarItem onSelect={onSessionSave} disabled={isReadOnly}>
                Save to ATproto
              </MenubarItem>
              <MenubarSeparator />
            </>
          )}
          <MenubarItem onSelect={onSessionDownload}>
            Download as file
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarSub>
            <MenubarSubTrigger>Layout</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={onViewLayoutAdd}>Add</MenubarItem>
              <MenubarItem onSelect={onViewLayoutRemove}>Remove</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem disabled>
            Quickstart <MenubarShortcut>⌘H</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Show All Commands <MenubarShortcut>⌘K</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <Link to={changeLogUrl} reloadDocument target="_blank">
            <MenubarItem>Show Release Notes</MenubarItem>
          </Link>
          <Link to={repoUrl} reloadDocument target="_blank">
            <MenubarItem>Go to Codeberg</MenubarItem>
          </Link>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
