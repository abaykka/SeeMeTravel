import type { Metadata } from "next";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = {
  title: "Build your globe",
  description: "Mark everywhere you have been and publish it as one shareable link.",
};

export default function BuildPage() {
  return <Editor />;
}
