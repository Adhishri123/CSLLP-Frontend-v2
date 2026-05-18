import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MaterialViewer = ({ material, onDelete }) => {
  // 🔥 CHANGE: Decide button based on type
  const getAction = () => {
    switch ((material.type || "").toUpperCase()) {
      case "VIDEO":
        return { label: "🎬 Watch", url: material.fileUrl };
      case "PDF":
        return { label: "📖 Read", url: material.fileUrl };
      case "DOCUMENT":
      default:
        return { label: "📂 Open", url: material.fileUrl };
    }
  };

  const action = getAction();

  return (
    <Card className="p-3 shadow-md">
      <CardTitle className="mb-2">{material.title}</CardTitle>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">
          {material.description || "No description"}
        </p>
        <div className="flex gap-2">
          <a href={action.url} target="_blank" rel="noreferrer">
            <Button size="sm">{action.label}</Button>
          </a>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
        {material.tags && (
          <div className="mt-2 flex flex-wrap gap-1">
            {material.tags.split(",").map((t, i) => (
              <span
                key={i}
                className="bg-gray-200 text-xs px-2 py-1 rounded-full"
              >
                #{t.trim()}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialViewer;
